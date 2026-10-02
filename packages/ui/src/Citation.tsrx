/** @jsxImportSource @nativescript-community/octane */
import { Utils } from '@nativescript/core';
import type { CitationProps } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';
import { useColorScheme } from './theme/colorScheme';
import { accentColor, mutedColor, textColor } from './scheme-colors';
import { nativeColor } from './native-color';
import { sanitizeUrl } from './safe-url';
import { isRenderable } from './is-renderable';
import { Pressable } from './Pressable.tsrx';

let warnedBlockedUrl = false;

/** Citation — labelled chip or numbered pill referencing a source. Safe
 *  `url`s open via Utils.openUrl; unsafe schemes render inert. A bare-string
 *  `source.icon` is a favicon URL; a node renders inside the icon circle. */
export function Citation(props: CitationProps) @{
	const scheme = useColorScheme();
	const source = props.source;
	const variant = props.variant ?? 'label';
	const href = source.url;
	const safeHref = href == null ? null : sanitizeUrl(href);
	const isLink = safeHref != null;

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
				style={{ fontSize: 11, fontWeight: 600, color: nativeColor(accentColor(scheme)) }}
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
					<image src={iconSrc} className="vx-citation-icon" style={{ width: 16, height: 16, borderRadius: 8 }} />
				) : null}
				{source.title != null ? (
					<label className="vx-citation-title" whiteSpace="nowrap" style={{ fontSize: 12, color: nativeColor(textColor(scheme)) }}>
						{source.title}
					</label>
				) : null}
				<label className="vx-citation-count" style={{ fontSize: 11, color: nativeColor(mutedColor(scheme)) }}>
					{props.number}
				</label>
			</>
		);

	const cls = cx('vx-citation', `vx-citation--${variant}`, isLink && 'vx-citation--link', props.className);

	return isLink ? (
		<Pressable
			ref={(v: any) => applyEscapeProps(v, props)}
			id={props.id}
			className={cls}
			style={{ flexDirection: 'row', alignItems: 'center', gap: 4, ...props.style }}
			accessibilityRole="link"
			accessibilityLabel={
				variant === 'number' ? `Citation ${props.number}` : `${source.title ?? 'Citation'} ${props.number}`
			}
			onPress={() => {
				if (safeHref != null) {
					Utils.openUrl(safeHref);
				}
			}}
		>
			{body}
		</Pressable>
	) : (
		<flexboxlayout
			ref={(v: any) => applyEscapeProps(v, props)}
			id={props.id}
			className={cls}
			style={{ flexDirection: 'row', alignItems: 'center', gap: 4, ...props.style }}
			flexDirection="row"
			alignItems="center"
			accessibilityLabel={
				variant === 'number' ? `Citation ${props.number}` : `${source.title ?? 'Citation'} ${props.number}`
			}
		>
			{body}
		</flexboxlayout>
	);
}
