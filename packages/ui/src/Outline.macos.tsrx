/** @jsxImportSource @octane-xplat/macos-renderer */
import { useState } from 'octane';
import type { OutlineProps } from './props';
import { cx } from './cx';
import { getColorScheme } from './colorScheme.macos';
import { accentColor, mutedColor, textColor } from './scheme-colors';

const DEFAULT_LABEL = 'Table of contents';

/** Outline — macOS leaf. The AppKit host has no scroll-position events, so
 *  scroll-spy and click-to-scroll are inert; activation updates the active
 *  item and fires the navigate callbacks (documented coverage gap). */
export function Outline(props: OutlineProps) @{
	const items = props.items ?? [];
	const label = props.label ?? DEFAULT_LABEL;
	const density = props.density ?? 'default';
	const scheme = getColorScheme();

	const controlled = props.activeId !== undefined;
	const [internalActive, setInternalActive] = useState<string | undefined>(items[0]?.id);
	const activeId = controlled ? props.activeId : internalActive;

	const activate = (id: string) => {
		if (!controlled) setInternalActive(id);
		props.onActiveIdChange?.(id);
		props.onNavigateStart?.(id);
		props.onNavigateEnd?.(id);
	};

	<flexboxlayout
		id={props.id}
		className={cx('vx-outline', `vx-outline--${density}`, props.className)}
		style={{ flexDirection: 'column', ...props.style }}
		flexDirection="column"
		accessibilityRole="list"
		accessibilityLabel={label}
	>
		{items.map((item) => {
			const isActive = item.id === activeId;
			return (
				<flexboxlayout
					key={item.id}
					className={cx('vx-outline-item', isActive && 'vx-outline-item--active')}
					flexDirection="row"
					alignItems="center"
					style={{
						paddingLeft: 8 + (item.level - 1) * 12,
						paddingTop: density === 'compact' ? 4 : 8,
						paddingBottom: density === 'compact' ? 4 : 8,
					}}
					accessibilityRole="button"
					accessibilityLabel={item.label}
					onTap={() => activate(item.id)}
				>
					<flexboxlayout
						style={{
							width: 2,
							height: 16,
							borderRadius: 1,
							backgroundColor: isActive ? accentColor(scheme) : 'transparent',
							marginRight: 8,
						}}
					/>
					<label
						whiteSpace="normal"
						style={{ fontSize: 13, color: isActive ? textColor(scheme) : mutedColor(scheme) }}
					>
						{item.label}
					</label>
				</flexboxlayout>
			);
		})}
	</flexboxlayout>
}
