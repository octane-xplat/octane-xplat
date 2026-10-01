/** @jsxImportSource @xplat/macos/renderer */
import type { CitationProps } from './props';
import { cx } from './cx';
import { getColorScheme } from './colorScheme.macos';
import { accentColor, mutedColor, textColor } from './scheme-colors';
import { isSafeUrl } from './safe-url';
import { isRenderable } from './is-renderable';
import { Pressable } from './Pressable.macos.tsrx';

let warnedBlockedUrl = false;

/** Citation — macOS leaf. Safe `url`s open via the `__xplatAppKit` bridge
 *  (globalThis.__xplatAppKit.openUrl) when present; otherwise inert. */
export function Citation(props: CitationProps) @{
	const scheme = getColorScheme();
	const source = props.source;
	const variant = props.variant ?? 'label';
	const href = source.url;
	const isLink = href != null && isSafeUrl(href);

	if (!warnedBlockedUrl && href != null && !isLink) {
		warnedBlockedUrl = true;
		console.warn(
			`[octane-xplat] Citation: blocked unsafe url ${JSON.stringify(href)} — the citation renders inert.`,
		);
	}

	const iconSrc = typeof source.icon === 'string' ? source.icon : isRenderable(source.icon) ? null : source.src;
	const iconNode = isRenderable(source.icon) && typeof source.icon !== 'string' ? source.icon : null;

	const body =
		variant === 'number' ? (
			<label
				className="vx-citation-num"
				style={{ fontSize: 11, fontWeight: 600, color: accentColor(scheme) }}
			>
				{props.number}
			</label>
		) : (
			<>
				{iconNode != null ? (
					<flexboxlayout className="vx-citation-icon" style={{ width: 16, height: 16, borderRadius: 8 }}>
						{iconNode}
					</flexboxlayout>
				) : iconSrc != null ? (
					<image src={iconSrc} style={{ width: 16, height: 16, borderRadius: 8 }} />
				) : null}
				{source.title != null ? (
					<label whiteSpace="nowrap" style={{ fontSize: 12, color: textColor(scheme) }}>
						{source.title}
					</label>
				) : null}
				<label style={{ fontSize: 11, color: mutedColor(scheme) }}>{props.number}</label>
			</>
		);

	const cls = cx('vx-citation', `vx-citation--${variant}`, isLink && 'vx-citation--link', props.className);
	const shared = {
		id: props.id,
		className: cls,
		style: { flexDirection: 'row', alignItems: 'center', gap: 4, ...props.style } as any,
		accessibilityLabel:
			variant === 'number' ? `Citation ${props.number}` : `${source.title ?? 'Citation'} ${props.number}`,
	};

	return isLink ? (
		<Pressable
			{...shared}
			accessibilityRole="link"
			onPress={() => {
				(globalThis as any).__xplatAppKit?.openUrl?.(href);
			}}
		>
			{body}
		</Pressable>
	) : (
		<flexboxlayout {...shared} flexDirection="row" alignItems="center" accessibilityRole="text">
			{body}
		</flexboxlayout>
	);
}
