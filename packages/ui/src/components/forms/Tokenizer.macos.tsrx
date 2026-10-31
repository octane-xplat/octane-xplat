/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import {
	useImperativeHandle,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
	useState,
	useSyncExternalStore,
} from 'octane'

import type {
	SearchableItem,
	SearchRequest,
	SearchSource,
	TokenizerProps,
	TypeaheadInputHandle,
	TypeaheadKeyEvent,
	TokenizerHandle,
	TokenizerChange,
	Renderable,
} from '../../props'

import { useSize } from '../layout/size-context'
import { useFieldControlProps } from './field-context'
import { hasDateComposition } from './date-composition.macos'
import type { NSView } from '@octane-xplat/platform/macos'
import { countClippedAppKitTokens } from './tokenizer-overflow.macos'
import type { TypeaheadQueryEntries } from '../../internal-props'
import { cx } from '@octane-xplat/lib'
import { FormField } from './FormField.macos.tsrx'
import { BaseTypeahead } from './BaseTypeahead.macos.tsrx'
import { Token } from './Token.macos.tsrx'
import { ActivityIndicator } from '../actions/controls.macos.tsrx'
import { Icon } from '../media/Icon.macos.tsrx'
import { Pressable } from '../actions/Pressable.macos.tsrx'
import { Popover } from '../overlays/Popover.macos.tsrx'
import { Tooltip } from '../overlays/Tooltip.tsrx'
import {
	BusyLaneProvider,
	createBusyIndicatorLane,
	type BusyIndicatorLane,
} from '../../internal/rendering/busy-lane'

const CREATABLE_ID_PREFIX = '__xds_create__'
const nativeValue = (view: unknown, key: string) => {
	const value = view && Reflect.get(view, key)
	return typeof value === 'function' ? value.call(view) : value
}

type TokenizerKeyEvent = TypeaheadKeyEvent & {
	altKey?: boolean
	ctrlKey?: boolean
	metaKey?: boolean
	shiftKey?: boolean
	stopPropagation?(): void
}

function EndLane(props: { lane: BusyIndicatorLane; endContent?: any; clear?: any }) @{
	const isBusy = useSyncExternalStore(props.lane.subscribe, props.lane.getIsBusy)
	if (!isBusy && props.endContent == null && props.clear == null) {
		return null
	}

	<masonview
		className="vx-tokenizer-endlane"
		style={mergeStyle({ flexDirection: 'row', alignItems: 'center' }, { display: 'flex' })}
	>
		{isBusy ? (
			<masonview className="vx-typeahead-spinner" style={{ display: 'flex' }}>
				<ActivityIndicator busy={true} />
			</masonview>
		) : null}
		{props.endContent}
		{props.clear}
	</masonview>
}

function TokenizerToken(props: {
	id: string
	measure: boolean
	register(id: string, view: NSView): () => void
	onLayoutChanged(): void
	children?: Renderable
}) @{
	// Each mounted copy owns its release. An old collapsed-row detach must
	// never remove a newer row's registration for the same selected key.
	const bind = useMemo(() => {
		let release: (() => void) | undefined
		return (view: NSView | null) => {
			release?.()
			release = undefined
			if (view && props.measure) {
				release = props.register(props.id, view)
			}
		}
	}, [props.id, props.measure, props.register])

	<masonview
		className="vx-tokenizer-token"
		ref={bind}
		onLayoutChanged={props.measure ? props.onLayoutChanged : undefined}
		style={{ display: 'flex', flexShrink: 0 }}
	>
		{props.children}
	</masonview>
}

/** AppKit token entry with current controlled selection and empty-input
 * Backspace removal. Native key/IME/focus and overflow layout remain unqualified. */
export function Tokenizer<T extends SearchableItem>(inProps: TokenizerProps<T>): unknown @{
	const props = useFieldControlProps(inProps)
	const live = useRef(props)
	live.current = props
	const writing = useRef(false),
		lastQuery = useRef('')

	const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
		blurVersion = useRef(0)

	const size = useSize(props.size, 'md')
	const inputHandle = useRef<TypeaheadInputHandle | null>(null)
	const wrapperRef = useRef<NSView | null>(null)
	const panelRef = useRef<NSView | null>(null)
	const bindPanel = useCallback((view: NSView | null) => {
		panelRef.current = view
	}, [])

	const clipRef = useRef<NSView | null>(null),
		counterRef = useRef<NSView | null>(null)

	const tokenEls = useRef(new Map<string, NSView>())
	const reclaimedCounter = useRef<{
		clip: NSView
		width: number
		origin: number
		items: T[]
		widths: number[]
	} | null>(null)

	const latestMeasure = useRef<() => void>(() => {}),
		queuedMeasure = useRef(false),
		measuredCount = useRef(0)

	const queueMeasure = useCallback(() => {
		if (queuedMeasure.current) {
			return
		}

		queuedMeasure.current = true
		void Promise.resolve().then(() => {
			queuedMeasure.current = false
			if (wrapperRef.current) {
				try {
					latestMeasure.current()
				} catch (error) {
					console.warn('[macos-tokenizer] measurement failed', error)
				}
			}
		})
	}, [])

	const bindCounter = useCallback((view: NSView | null) => {
		counterRef.current = view
		queueMeasure()
	}, [])

	const bindClip = useCallback((view: NSView | null) => {
		clipRef.current = view
		queueMeasure()
	}, [])

	const registerToken = useCallback((id: string, view: NSView) => {
		tokenEls.current.set(id, view)
		queueMeasure()
		return () => {
			if (tokenEls.current.get(id) === view) {
				tokenEls.current.delete(id)
			}

			queueMeasure()
		}
	}, [])

	const cancelBlur = () => {
		blurVersion.current++
		if (blurTimer.current != null) {
			clearTimeout(blurTimer.current)
		}

		blurTimer.current = null
	}

	const bindWrapper = useCallback((view: NSView | null) => {
		wrapperRef.current = view
		if (!view) {
			cancelBlur()
		} else {
			queueMeasure()
		}
	}, [])

	const bindInput = useCallback((handle: TypeaheadInputHandle | null) => {
		inputHandle.current = handle
	}, [])

	const canChange = () =>
		!!wrapperRef.current && !live.current.isDisabled && !live.current.isReadOnly && !writing.current

	const inputOwnsFocus = () => {
		const view = inputHandle.current?.native,
			window = nativeValue(view, 'window'),
			responder = window?.firstResponder

		return (
			!!view &&
			!!window &&
			(responder === view ||
				(responder != null && responder === nativeValue(view, 'currentEditor')))
		)
	}

	const containsFocus = (root: NSView | null) => {
		if (!root) {
			return false
		}

		const responder = nativeValue(nativeValue(root, 'window'), 'firstResponder')
		// AppKit's shared field editor delegates to the owning text field.
		for (const start of [responder, nativeValue(responder, 'delegate')]) {
			const seen = new Set<object>()
			for (let view = start; view && !seen.has(view); view = nativeValue(view, 'superview')) {
				if (view === root) {
					return true
				}

				seen.add(view)
			}
		}

		return false
	}

	const busyLane = useMemo(() => createBusyIndicatorLane(), [])
	const [isFocusedWithin, setIsFocusedWithin] = useState(false)
	const [layerOpen, setLayerOpen] = useState(false)
	const [overflowCount, setOverflowCount] = useState(0)

	const tokenOverflowBehavior = props.tokenOverflowBehavior ?? 'none'
	const isLayerMode = tokenOverflowBehavior === 'unfocusedLayer'
	const isTruncated = !isFocusedWithin && tokenOverflowBehavior !== 'none' && props.value.length > 0
	const isAtMax = props.maxEntries != null && props.value.length >= props.maxEntries

	const handle = useMemo<TokenizerHandle>(
		() => ({
			focus() {
				const current = live.current
				if (!wrapperRef.current || (current.isDisabled && !current.disabledMessage)) {
					return
				}

				if (current.tokenOverflowBehavior === 'unfocusedLayer') {
					setLayerOpen(true)
				}

				inputHandle.current?.focus()
			},
			blur() {
				if (!wrapperRef.current) {
					return
				}

				inputHandle.current?.blur()
				if (wrapperRef.current) {
					setLayerOpen(false)
					setIsFocusedWithin(false)
				}
			},
			get native() {
				return wrapperRef.current
			},
		}),
		[],
	)

	useImperativeHandle(props.ref, () => handle, [props.ref])

	const selectedIds = useMemo(() => new Set(props.value.map((item) => item.id)), [props.value])

	const filteredSource: SearchSource<T> = useMemo(
		() => ({
			search: async (query: string, request?: SearchRequest) =>
				(await props.searchSource.search(query, request)).filter(
					(item) => !selectedIds.has(item.id),
				),
			bootstrap: async (request?: SearchRequest) =>
				(await props.searchSource.bootstrap(request)).filter((item) => !selectedIds.has(item.id)),
		}),
		[props.searchSource, selectedIds],
	)

	const emptySource: SearchSource<T> = useMemo(
		() => ({ search: async () => [], bootstrap: async () => [] }),
		[],
	)

	const createEntries = (query: string, results: T[]): T[] => {
		const trimmed = query.trim()
		if (!props.hasCreate || trimmed === '') {
			return []
		}

		const alreadyExists =
			selectedIds.has(trimmed) ||
			results.some((item) => item.label.toLowerCase() === trimmed.toLowerCase())

		if (alreadyExists) {
			return []
		}

		return [
			{
				id: `${CREATABLE_ID_PREFIX}${trimmed}`,
				label: `Create "${trimmed}"`,
				auxiliaryData: { __createdValue: trimmed },
			} as unknown as T,
		]
	}

	const queryEntries: TypeaheadQueryEntries<T> = { __queryEntries: createEntries }

	const emit = (items: T[], change: TokenizerChange<T>, restoreFocus = false): boolean => {
		if (!canChange()) {
			return false
		}

		const root = wrapperRef.current,
			input = inputHandle.current,
			view = input?.native

		const window = nativeValue(view, 'window'),
			responder = window?.firstResponder,
			notify = live.current.onChange

		writing.current = true
		try {
			notify(items, change)
		} finally {
			writing.current = false
		}

		// Preserve callback-driven teardown, blocking and newer focus choices.
		if (
			restoreFocus &&
			canChange() &&
			wrapperRef.current === root &&
			input &&
			inputHandle.current === input &&
			input.native === view &&
			window &&
			nativeValue(view, 'window') === window &&
			window.firstResponder === responder &&
			!inputOwnsFocus()
		) {
			input.focus()
		}

		return true
	}

	const handleAdd = (item: T | null) => {
		// BaseTypeahead clears its query before reporting selection, including
		// a selection the controlled wrapper subsequently rejects.
		lastQuery.current = ''
		if (!item || !canChange()) {
			return
		}

		const current = live.current
		if (current.maxEntries != null && current.value.length >= current.maxEntries) {
			return
		}

		if (item.id.startsWith(CREATABLE_ID_PREFIX)) {
			if (!current.hasCreate) {
				return
			}

			const text = item.id.slice(CREATABLE_ID_PREFIX.length)
			if (current.value.some((value) => value.id === text)) {
				return
			}

			const created = { id: text, label: text } as T
			emit([...current.value, created], { item: created, type: 'create' })
			return
		}

		if (!current.value.some((value) => value.id === item.id)) {
			emit([...current.value, item], { item, type: 'add' })
		}
	}

	const handleRemove = (item: T, restoreFocus = true): boolean => {
		if (!canChange()) {
			return false
		}

		const current = live.current,
			owned = current.value.find((value) => value.id === item.id)

		return owned
			? emit(
					current.value.filter((value) => value.id !== owned.id),
					{ item: owned, type: 'remove' },
					restoreFocus,
				)
			: false
	}

	const handleClearAll = () => {
		if (!canChange()) {
			return
		}

		const current = live.current
		if (current.value.length) {
			emit([], { item: current.value[current.value.length - 1], type: 'remove' }, true)
		}
	}

	const handleQueryChange = (query: string) => {
		if (!wrapperRef.current) {
			return
		}

		lastQuery.current = query
		live.current.onChangeQuery?.(query)
	}

	const handleKeyDown = (event: TokenizerKeyEvent) => {
		const view = inputHandle.current?.native
		if (
			!view ||
			!canChange() ||
			event.defaultPrevented ||
			hasDateComposition(view, event) ||
			event.altKey ||
			event.ctrlKey ||
			event.metaKey ||
			event.shiftKey ||
			event.key !== 'Backspace' ||
			lastQuery.current !== ''
		) {
			return
		}

		const editor = nativeValue(view, 'currentEditor'),
			text = nativeValue(editor, 'string') ?? nativeValue(view, 'stringValue')

		if (text != null && String(text) !== '') {
			return
		}

		const items = live.current.value
		if (!items.length) {
			return
		}

		event.preventDefault()
		event.stopPropagation?.()
		handleRemove(items[items.length - 1], false)
	}

	// Delay collapse only while this attached field still owns the request.
	const collapseSoon = () => {
		if (!wrapperRef.current) {
			return
		}

		cancelBlur()
		const owner = wrapperRef.current,
			version = blurVersion.current

		blurTimer.current = setTimeout(() => {
			if (version !== blurVersion.current || wrapperRef.current !== owner) {
				return
			}

			blurTimer.current = null
			if (
				inputOwnsFocus() ||
				containsFocus(wrapperRef.current) ||
				containsFocus(panelRef.current)
			) {
				return
			}

			setIsFocusedWithin(false)
			setLayerOpen(false)
			live.current.onBlur?.()
		}, 50)
	}

	const focusEntered = () => {
		if (!wrapperRef.current) {
			return
		}

		cancelBlur()
		setIsFocusedWithin(true)
		if (live.current.tokenOverflowBehavior === 'unfocusedLayer') {
			setLayerOpen(true)
		}

		live.current.onFocus?.()
	}

	useEffect(() => () => cancelBlur(), [])

	// Read actual native rectangles after commit/layout. The counter is a
	// sibling of this viewport, so its width participates in Mason's layout.
	const measureOverflow = () => {
		if (!wrapperRef.current) {
			return
		}

		const collapsed = isLayerMode || isTruncated,
			clip = clipRef.current,
			held = reclaimedCounter.current

		const views = props.value.map((item) => tokenEls.current.get(item.id) ?? null)
		// After removing the counter, wait for its space to reach the viewport.
		// Stale native layout notifications must not reserve the counter again.
		if (
			collapsed &&
			held &&
			held.clip === clip &&
			held.items === props.value &&
			held.width === Number(clip?.bounds.size.width) &&
			held.origin === Number(clip?.bounds.origin.x) &&
			held.widths.length === views.length &&
			held.widths.every((width, index) => width === Number(views[index]?.bounds.size.width))
		) {
			return
		}

		reclaimedCounter.current = null
		const hidden =
			!collapsed || !props.value.length
				? 0
				: countClippedAppKitTokens(clip, views, overflowCount > 0 ? counterRef.current : null)

		// Incomplete/detached/zero-size layout is not evidence of zero overflow.
		if (hidden != null && hidden !== measuredCount.current) {
			if (
				hidden === 0 &&
				overflowCount > 0 &&
				clip &&
				countClippedAppKitTokens(clip, views) !== 0
			) {
				reclaimedCounter.current = {
					clip,
					width: Number(clip.bounds.size.width),
					origin: Number(clip.bounds.origin.x),
					items: props.value,
					widths: views.map((view) => Number(view?.bounds.size.width)),
				}
			}

			measuredCount.current = hidden
			setOverflowCount(hidden)
		}
	}

	latestMeasure.current = measureOverflow
	useLayoutEffect(queueMeasure, [isLayerMode, isTruncated, props.value, size])

	const startIcon =
		props.startIcon == null ? null : typeof props.startIcon === 'string' ? (
			<Icon name={props.startIcon} size={16} />
		) : (
			props.startIcon
		)

	const renderTokens = (measure = true) =>
		props.value.map((item) => {
			const onRemoveItem = () => handleRemove(item)
			const body = props.renderToken ? (
				props.renderToken(item, onRemoveItem)
			) : (
				<Token
					label={item.label}
					size={size}
					onRemove={props.isDisabled || props.isReadOnly ? undefined : onRemoveItem}
					isDisabled={props.isDisabled || props.isReadOnly}
				/>
			)

			return (
				<TokenizerToken
					key={item.id}
					id={item.id}
					measure={measure}
					register={registerToken}
					onLayoutChanged={queueMeasure}
				>
					{body}
				</TokenizerToken>
			)
		})

	const tokens = renderTokens()
	const clippedTokens = (
		<masonview
			className="vx-tokenizer-clip"
			ref={bindClip}
			onLayoutChanged={queueMeasure}
			style={{
				display: 'flex',
				flexDirection: 'row',
				flexWrap: 'nowrap',
				flexGrow: 1,
				flexShrink: 1,
				width: 0,
				minWidth: 0,
				overflow: 'hidden',
			}}
		>
			{tokens}
		</masonview>
	)

	const hasClearButton = Boolean(
		props.hasClear && props.value.length > 0 && !props.isDisabled && !props.isReadOnly,
	)

	const wrapperClass = cx(
		'vx-tokenizer',
		`vx-tokenizer--size-${size}`,
		props.value.length > 0 && 'vx-tokenizer--filled',
		isTruncated && 'vx-tokenizer--truncated',
		props.isDisabled && 'vx-tokenizer--disabled',
		props.status && `vx-tokenizer--status-${props.status.type}`,
	)

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
				isFocusableDisabled={!!props.isDisabled && !!props.disabledMessage}
				hasAutoFocus={props.hasAutoFocus}
				onChangeQuery={handleQueryChange}
				onKeyDown={handleKeyDown}
				{...queryEntries}
				debounceMs={props.debounceMs}
				anchorRef={{ current: wrapperRef.current }}
				size={size}
				isReadOnly={props.isReadOnly}
				inputClassName={
					isAtMax || isTruncated
						? 'vx-tokenizer-input--atmax'
						: props.value.length > 0
							? 'vx-tokenizer-input--compact'
							: undefined
				}
				onFocus={focusEntered}
				onBlur={collapseSoon}
				ref={bindInput}
			/>
		</BusyLaneProvider>
	)

	const clearButton = hasClearButton ? (
		<Pressable className="vx-input-clear" accessibilityLabel="Clear all" onPress={handleClearAll}>
			<label text="×" />
		</Pressable>
	) : null

	let content: any
	if (isLayerMode) {
		// The collapsed row anchors the popover; the full field lives inside it.
		content = (
			<>
				<masonview
					className={wrapperClass}
					ref={bindWrapper}
					onBlur={collapseSoon}
					onLayoutChanged={queueMeasure}
					onTap={() => {
						if (!live.current.isDisabled) {
							focusEntered()
						}
					}}
					accessibilityState={{ disabled: props.isDisabled }}
					style={mergeStyle(
						{ flexDirection: 'row', alignItems: 'center', flexWrap: 'nowrap' },
						{ display: 'flex' },
					)}
				>
					{startIcon}
					{clippedTokens}
					<label
						className="vx-tokenizer-overflow"
						ref={bindCounter}
						style={{ display: overflowCount > 0 ? 'flex' : 'none', flexShrink: 0 }}
						text={overflowCount > 0 ? `+${overflowCount} more` : ''}
					/>
				</masonview>
				<Popover
					anchor={wrapperRef}
					open={layerOpen}
					placement="bottom"
					onDismiss={collapseSoon}
					className="vx-tokenizer-layer"
				>
					<masonview
						className="vx-tokenizer"
						ref={bindPanel}
						onBlur={collapseSoon}
						style={mergeStyle(
							{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
							{ display: 'flex' },
						)}
					>
						{startIcon}
						{renderTokens(false)}
						{fieldControls}
						<EndLane lane={busyLane} endContent={props.endContent} clear={clearButton} />
					</masonview>
				</Popover>
			</>
		)
	} else {
		content = (
			<masonview
				className={wrapperClass}
				ref={bindWrapper}
				onBlur={collapseSoon}
				onLayoutChanged={queueMeasure}
				onTap={() => {
					if (!live.current.isDisabled) {
						inputHandle.current?.focus()
					}
				}}
				accessibilityState={{ disabled: props.isDisabled }}
				style={mergeStyle(
					{ flexDirection: 'row', alignItems: 'center', flexWrap: isTruncated ? 'nowrap' : 'wrap' },
					{ display: 'flex' },
				)}
			>
				{startIcon}
				{isTruncated ? clippedTokens : tokens}
				{isTruncated ? (
					<label
						className="vx-tokenizer-overflow"
						ref={bindCounter}
						style={{ display: overflowCount > 0 ? 'flex' : 'none', flexShrink: 0 }}
						text={overflowCount > 0 ? `+${overflowCount} more` : ''}
					/>
				) : null}
				{fieldControls}
				<EndLane lane={busyLane} endContent={props.endContent} clear={clearButton} />
			</masonview>
		)
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
		style={{ ...(props.width != null ? { width: props.width } : {}), ...styleRecord(props.style) }}
	>
		{props.isDisabled && props.disabledMessage ? (
			<Tooltip trigger={content} content={props.disabledMessage} placement="top" />
		) : (
			content
		)}
	</FormField>
}
