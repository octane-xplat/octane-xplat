/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import { useEffect, useMemo, useRef, useState } from 'octane'
import { createAppKitOutlineScroll } from './outline-scroll.macos'
import { readReducedMotion } from '../../internal/platform/animation-host.macos'
import type { OutlineProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { getColorScheme } from '../../theme/colorScheme.macos'
import { accentColor, mutedColor, textColor } from '../../theme/scheme-colors'

const DEFAULT_LABEL = 'Table of contents'

/** Native heading navigation and uncontrolled scroll-spy source path. */
export function Outline(props: OutlineProps) @{
	const items = props.items ?? []
	const label = props.label ?? DEFAULT_LABEL
	const density = props.density ?? 'default'
	const scheme = getColorScheme()

	const controlled = props.activeId !== undefined
	const [internalActive, setInternalActive] = useState<string | undefined>(items[0]?.id)
	const activeId = controlled ? props.activeId : internalActive

	const latest = useRef(props), active = useRef(activeId), nav = useRef<any>(null)
	latest.current = props; active.current = activeId
	const control = useMemo(() => createAppKitOutlineScroll({ props: () => latest.current, root: () => nav.current,
		active: () => active.current, reducedMotion: readReducedMotion,
		change(id) { if (latest.current.activeId === undefined) { active.current = id; setInternalActive(id) }; latest.current.onActiveIdChange?.(id) },
	}), [])
	useEffect(() => { control.sync() })
	useEffect(() => () => control.dispose(), [])

	<masonview
		ref={nav}
		id={props.id}
		className={cx('vx-outline', `vx-outline--${density}`, props.className)}
		style={mergeStyle(
			{ flexDirection: 'column' },
			mergeStyle({ display: 'flex' }, { flexDirection: 'column', ...styleRecord(props.style) }),
		)}
		accessibilityRole="list"
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
					accessibilityRole="button"
					accessibilityLabel={item.label}
					accessibilityState={{ selected: isActive }}
					onTap={() => control.activate(item.id)}
				>
					<masonview
						style={mergeStyle(
							{ display: 'flex' },
							{
								width: 2,
								height: 16,
								borderRadius: 1,
								backgroundColor: isActive ? accentColor(scheme) : 'transparent',
								marginRight: 8,
							},
						)}
					/>
					<label
						whiteSpace="normal"
						style={{ fontSize: 13, color: isActive ? textColor(scheme) : mutedColor(scheme) }}
					>
						{item.label}
					</label>
				</masonview>
			)
		})}
	</masonview>
}
