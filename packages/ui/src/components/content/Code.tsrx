/** @jsxImportSource @octane-xplat/jsx */
import { useColorScheme } from '../../theme/colorScheme'
import { styleRecord } from '../../internal/layout/style-merge'
import type { CodeProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { Text } from './Text'
import { mutedColor } from '../../theme/scheme-colors'
import { nativeColor } from '../../theme/native-color'

/** Code — inline monospace run. Renders through `Text`, so nested inside
 *  `<Text>`/`<RichText>` it stays an inline span; standalone it is a
 *  single-line label. `size="inherit"` is inert on native (a nested span
 *  already inherits the parent label's metrics). Native spans can't resolve
 *  the `vx-code` background/padding skin — the mono font, muted color, and
 *  chip background on a standalone label come from the class. */
export function Code(props: CodeProps) @{
	const scheme = useColorScheme()
	const colorStyle =
		props.color === 'secondary' ? { color: nativeColor(mutedColor(scheme)) } : undefined

	<Text
		id={props.id}
		className={cx('vx-code', props.color === 'secondary' && 'vx-color-secondary', props.className)}
		style={{ fontFamily: 'monospace', ...colorStyle, ...styleRecord(props.style) }}
	>
		{props.children}
	</Text>
}
