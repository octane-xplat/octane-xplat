/** @jsxImportSource @xplat/macos/renderer */
import type { TokenProps } from "./props";
import { cx } from "./cx";
import { Pressable } from './Pressable.macos.tsrx';
import { Icon } from './Icon.macos.tsrx';
import { pushDeepLink } from './route.macos';
import { useThemeScheme } from './theme/theme-scheme.macos';

/** Inline chrome — the AppKit host has no CSS layer; values mirror
 *  `.vx-token--*` in chrome.css for both color schemes. */
const TOKEN_COLORS: Record<string, Record<'light' | 'dark', [string, string]>> = {
	default: { light: ['#eaeaea', '#0a0a0a'], dark: ['#333333', '#f5f5f5'] },
	red: { light: ['#fee2e2', '#991b1b'], dark: ['#7f1d1d', '#fecaca'] },
	orange: { light: ['#ffedd5', '#9a3412'], dark: ['#7c2d12', '#fed7aa'] },
	yellow: { light: ['#fef9c3', '#854d0e'], dark: ['#713f12', '#fef08a'] },
	green: { light: ['#dcfce7', '#166534'], dark: ['#14532d', '#bbf7d0'] },
	teal: { light: ['#ccfbf1', '#115e59'], dark: ['#134e4a', '#99f6e4'] },
	cyan: { light: ['#cffafe', '#155e75'], dark: ['#164e63', '#a5f3fc'] },
	blue: { light: ['#dbeafe', '#1e40af'], dark: ['#1e3a8a', '#bfdbfe'] },
	purple: { light: ['#f3e8ff', '#6b21a8'], dark: ['#581c87', '#e9d5ff'] },
	pink: { light: ['#fce7f3', '#9d174d'], dark: ['#831843', '#fbcfe8'] },
	gray: { light: ['#f3f4f6', '#374151'], dark: ['#374151', '#e5e7eb'] },
};

/** Token — inline entity chip. macOS leaf: `href` routes through
 *  pushDeepLink like Link; chrome is inlined (no CSS layer). */
export function Token(props: TokenProps) @{
	const scheme = useThemeScheme();
	const icon = props.icon == null
		? null
		: typeof props.icon === 'string'
			? <Icon name={props.icon} size={14} />
			: props.icon;

	const [bg, fg] = (TOKEN_COLORS[props.color ?? 'default'] ?? TOKEN_COLORS.default)[scheme];
	const interactive = !props.isDisabled && (props.onClick != null || props.href != null);

	const activate = () => {
		if (props.isDisabled) return;
		if (props.href != null) {
			pushDeepLink(props.href);
		} else {
			props.onClick?.();
		}
	};

	const content = <>
		{icon}
		<label className="vx-token-label" text={props.label} style={{ color: fg }} />
		{props.endContent}
		{props.onRemove != null
			? <Pressable
				className="vx-token-remove"
				disabled={props.isDisabled}
				onPress={() => props.onRemove?.()}
				accessibilityLabel={'Remove ' + props.label}
			>
				<label text="✕" style={{ color: fg, marginLeft: 4, width: 12, textAlign: 'center' }} />
			</Pressable>
			: null}
	</>;

	const classes = cx(
		'vx-token',
		`vx-token--size-${props.size ?? 'md'}`,
		`vx-token--${props.color ?? 'default'}`,
		interactive && 'vx-token--interactive',
		props.isDisabled && 'vx-token--disabled',
		props.className,
	);
	const tokenStyle = {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: bg,
		borderRadius: 4,
		paddingLeft: 8,
		paddingRight: 8,
		opacity: props.isDisabled ? 0.5 : 1,
		...props.style,
	};

	if (interactive) {
		return <Pressable
			id={props.id}
			className={classes}
			style={tokenStyle}
			disabled={props.isDisabled}
			onPress={activate}
			accessibilityLabel={props.label}
			accessibilityHint={props.description}
			accessibilityRole={props.href != null ? 'link' : 'button'}
			bind={props.bind}
		>
			{content}
		</Pressable>
	}

	return <flexboxlayout
		id={props.id}
		className={classes}
		style={tokenStyle}
		accessibilityLabel={props.isLabelHidden ? props.label : undefined}
		accessibilityHint={props.description}
		accessibilityState={{ disabled: props.isDisabled }}
	>
		{content}
	</flexboxlayout>
}
