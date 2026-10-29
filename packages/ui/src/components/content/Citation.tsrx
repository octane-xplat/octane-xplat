/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import { Utils } from '@nativescript/core'
import type { CitationProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from '../overlays/escape-props'
import { useColorScheme } from '../../theme/colorScheme'
import { accentColor, mutedColor, textColor } from '../../theme/scheme-colors'
import { nativeColor } from '../../theme/native-color'
import { sanitizeUrl } from '../../routing/safe-url'
import { isRenderable } from '../../internal/rendering/is-renderable'
import { Pressable } from '../actions/Pressable'

let warnedBlockedUrl = false

/** Citation — labelled chip or numbered pill referencing a source. Safe
 *  `url`s open via Utils.openUrl; unsafe schemes render inert. A bare-string
 *  `source.icon` is a favicon URL; a node renders inside the icon circle. */
export function Citation(props: CitationProps) @{
	const scheme = useColorScheme()
	const source = props.source
	const variant = props.variant ?? 'label'
	const href = source.url
	const safeHref = href == null ? null : sanitizeUrl(href)
	const isLink = safeHref != null

	if (!warnedBlockedUrl && href != null && !isLink) {
		warnedBlockedUrl = true
		console.warn(
			`[octane-xplat] Citation: blocked unsafe url ${JSON.stringify(href)} — the citation renders inert.`,
		)
	}

	const iconSrc =
		typeof source.icon === 'string' ? source.icon : isRenderable(source.icon) ? null : source.src

	const iconNode = isRenderable(source.icon) && typeof source.icon !== 'string' ? source.icon : null

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
					<masonview
						className="vx-citation-icon"
						style={mergeStyle({ display: 'flex' }, { width: 16, height: 16, borderRadius: 8 })}
					>
						{iconNode}
					</masonview>
				) : iconSrc != null ? (
					<image
						src={iconSrc}
						className="vx-citation-icon"
						style={{ width: 16, height: 16, borderRadius: 8 }}
					/>
				) : null}
				{source.title != null ? (
					<label
						className="vx-citation-title"
						whiteSpace="nowrap"
						style={{ fontSize: 12, color: nativeColor(textColor(scheme)) }}
					>
						{source.title}
					</label>
				) : null}
				<label
					className="vx-citation-count"
					style={{ fontSize: 11, color: nativeColor(mutedColor(scheme)) }}
				>
					{props.number}
				</label>
			</>
		)

	const cls = cx(
		'vx-citation',
		`vx-citation--${variant}`,
		isLink && 'vx-citation--link',
		props.className,
	)

	return isLink ? (
		<Pressable
			ref={(v: any) => applyEscapeProps(v, props)}
			id={props.id}
			className={cls}
			style={props.style}
			accessibilityRole="link"
			accessibilityLabel={
				variant === 'number'
					? `Citation ${props.number}`
					: `${source.title ?? 'Citation'} ${props.number}`
			}
			onPress={() => {
				if (safeHref != null) {
					Utils.openUrl(safeHref)
				}
			}}
		>
			{body}
		</Pressable>
	) : (
		<masonview
			ref={(v: any) => applyEscapeProps(v, props)}
			id={props.id}
			className={cls}
			style={mergeStyle({ display: 'flex' }, { ...styleRecord(props.style) })}
			accessibilityLabel={
				variant === 'number'
					? `Citation ${props.number}`
					: `${source.title ?? 'Citation'} ${props.number}`
			}
		>
			{body}
		</masonview>
	)
}
