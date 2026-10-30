/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import { useEffect, useRef, useState } from 'octane'
import type { OutlineProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import {
	applyEscapeProps,
	nativeAccessibilityRole,
	nativeAccessibilityState,
} from '../overlays/escape-props'

import { useColorScheme } from '../../theme/colorScheme'
import { accentColor, mutedColor, textColor } from '../../theme/scheme-colors'
import { nativeColor } from '../../theme/native-color'
import { findViewById } from './outline-view-tree'

const DEFAULT_LABEL = 'Table of contents'
const SPY_EDGE = 8

/** Find the nearest enclosing scroll container walking up the view tree.
 *  MasonKit gives every element a scroll surface, so match on the resolved
 *  overflow style: the renderer's `<scrollview>` sets
 *  `style.overflowY = 'scroll'` and Mason scroll containers use those
 *  values. */
function findScroller(view: any): any {
	let node = view?.parent
	while (node) {
		const overflowY = node.style?.overflowY
		if (overflowY === 'scroll' || overflowY === 'auto') {
			return node
		}

		node = node.parent
	}

	return null
}

/** Outline — native leaf. Per-item active bars replace the web's sliding
 *  indicator (no CSS transition on a shared indicator element). Scroll spy
 *  listens to the resolved scroller's 'scroll' event and activates the
 *  last heading above the offset edge; activation calls
 *  `scrollTo({ top, behavior: 'smooth' })`. */
export function Outline(props: OutlineProps): unknown @{
	const items = props.items ?? []
	const label = props.label ?? DEFAULT_LABEL
	const density = props.density ?? 'default'
	const offset = props.offset ?? 0
	const hasScrollOnClick = props.hasScrollOnClick ?? true
	const scheme = useColorScheme()

	const controlled = props.activeId !== undefined
	const [internalActive, setInternalActive] = useState<string | undefined>(items[0]?.id)
	const activeId = controlled ? props.activeId : internalActive
	const activeIdRef = useRef<string | undefined>(activeId)
	activeIdRef.current = activeId

	const navRef = useRef<any>(null)
	const navigating = useRef<string | undefined>(undefined)
	const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

	const setActive = (id: string) => {
		if (!controlled) {
			setInternalActive(id)
		}

		props.onActiveIdChange?.(id)
	}

	const containerView = () => props.scrollContainerRef?.current ?? findScroller(navRef.current)

	// Scroll spy — uncontrolled only. MasonKit elements emit 'scroll'; the
	// listener only attaches when the event exists on the resolved host.
	useEffect(() => {
		if (controlled || items.length === 0) {
			return
		}

		const scroller = containerView()
		if (!scroller?.on) {
			return
		}

		const spy = () => {
			const scrollY = Number(scroller.scrollTop ?? 0)
			const edge = scrollY + offset + SPY_EDGE
			let current = items[0]?.id
			for (const item of items) {
				const heading = findViewById(scroller, item.id)
				const top = heading ? (heading.getLocationRelativeTo?.(scroller)?.y ?? 0) + scrollY : null
				if (top != null && top <= edge) {
					current = item.id
				}
			}

			if (current && current !== activeIdRef.current) {
				setActive(current)
			}
		}

		scroller.on('scroll', spy)
		spy()
		return () => scroller.off?.('scroll', spy)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [controlled, items, offset])

	const settle = (id: string) => {
		if (settleTimer.current !== undefined) {
			clearTimeout(settleTimer.current)
		}

		settleTimer.current = setTimeout(() => {
			if (navigating.current === id) {
				navigating.current = undefined
				props.onNavigateEnd?.(id)
			}
		}, 150)
	}

	const activate = (id: string) => {
		setActive(id)
		navigating.current = id
		props.onNavigateStart?.(id)
		const scroller = containerView()
		const heading = scroller ? findViewById(scroller, id) : null
		if (hasScrollOnClick && scroller && heading) {
			const scrollY = Number(scroller.scrollTop ?? 0)
			const rel = heading.getLocationRelativeTo?.(scroller)
			const top = rel ? rel.y + scrollY - offset : scrollY
			scroller.scrollTo?.({ top: Math.max(0, top), behavior: 'smooth' })
		}

		settle(id)
	}

	<masonview
		ref={(v: any) => {
			navRef.current = v
			applyEscapeProps(v, props)
		}}
		id={props.id}
		className={cx('vx-outline', `vx-outline--${density}`, props.className)}
		style={mergeStyle({ display: 'flex' }, { ...styleRecord(props.style) })}
		accessible={true}
		accessibilityRole={nativeAccessibilityRole('none')}
		accessibilityLabel={label}
	>
		{items.map((item) => {
			const isActive = item.id === activeId
			return (
				<masonview
					key={item.id}
					className={cx('vx-outline-item', isActive && 'vx-outline-item--active')}
					style={mergeStyle(
						{ flexDirection: 'row', alignItems: 'center' },
						mergeStyle(
							{ display: 'flex' },
							{
								paddingLeft: 8 + (item.level - 1) * 12,
								paddingTop: density === 'compact' ? 4 : 8,
								paddingBottom: density === 'compact' ? 4 : 8,
							},
						),
					)}
					accessible={true}
					accessibilityRole={nativeAccessibilityRole('button')}
					accessibilityLabel={item.label}
					accessibilityState={nativeAccessibilityState({ selected: isActive })}
					onTap={() => activate(item.id)}
				>
					<masonview
						className="vx-outline-item-bar"
						style={mergeStyle(
							{ display: 'flex' },
							{
								width: 2,
								height: 16,
								borderRadius: 1,
								backgroundColor: isActive
									? nativeColor(accentColor(scheme))
									: nativeColor('transparent'),
								marginRight: 8,
							},
						)}
					/>
					<label
						className="vx-outline-item-label"
						whiteSpace="normal"
						style={{
							fontSize: 13,
							color: nativeColor(isActive ? textColor(scheme) : mutedColor(scheme)),
						}}
					>
						{item.label}
					</label>
				</masonview>
			)
		})}
	</masonview>
}
