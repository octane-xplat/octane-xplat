/** @jsxImportSource @nativescript-community/octane */
import { useColorScheme } from './theme/colorScheme';
import type { CodeProps } from './props';
import { cx } from './cx';
import { Text } from './Text.tsrx';
import { mutedColor } from './scheme-colors';
import { nativeColor } from './native-color';

/** Code — inline monospace run. Renders through `Text`, so nested inside
 *  `<Text>`/`<RichText>` it stays an inline span; standalone it is a
 *  single-line label. `size="inherit"` is inert on native (a nested span
 *  already inherits the parent label's metrics). Native spans can't resolve
 *  the `vx-code` background/padding skin — the mono font, muted color, and
 *  chip background on a standalone label come from the class. */
export function Code(props: CodeProps) @{
	const scheme = useColorScheme();
	const colorStyle =
		props.color === 'secondary' ? { color: nativeColor(mutedColor(scheme)) } : undefined;

	<Text
		id={props.id}
		className={cx('vx-code', props.color === 'secondary' && 'vx-color-secondary', props.className)}
		style={{ fontFamily: 'ui-monospace', ...colorStyle, ...props.style }}
	>
		{props.children}
	</Text>
}
