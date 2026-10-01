import type { CitationProps } from './props';
import { applyEscapeProps } from './escape-props';
import { sanitizeUrl } from './safe-url';
import { isRenderable } from './is-renderable';

let warnedBlockedUrl = false;

/** Citation — a labelled chip or numbered pill referencing a source.
 *  Unsafe schemes (javascript:, vbscript:, data:text/html) render the
 *  citation inert instead of navigating. A bare-string `source.icon` is a
 *  favicon URL (back-compat); a node renders inside the icon circle; when
 *  both `icon` node and `src` exist the node wins. */
export function Citation(props: CitationProps) @{
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

	const iconNode =
		typeof source.icon === 'string'
			? <img className="vx-citation-icon-img" src={source.icon} alt="" aria-hidden="true" />
			: isRenderable(source.icon)
				? source.icon
				: isRenderable(source.src)
					? <img className="vx-citation-icon-img" src={source.src} alt="" aria-hidden="true" />
					: null;

	const body =
		variant === 'number' ? (
			<span className="vx-citation-num">{props.number}</span>
		) : (
			<>
				{iconNode != null ? <span className="vx-citation-icon">{iconNode}</span> : null}
				{source.title != null ? <span className="vx-citation-title">{source.title}</span> : null}
				<span className="vx-citation-count">{props.number}</span>
			</>
		);

	const cls = [
		'vx-citation',
		`vx-citation--${variant}`,
		isLink && 'vx-citation--link',
		props.className,
	];

	return isLink ? (
		<a
			ref={(e: any) => applyEscapeProps(e, props)}
			id={props.id}
			className={cls}
			style={props.style}
			href={safeHref}
			target="_blank"
			rel="noopener noreferrer"
			aria-label={variant === 'number' ? `Citation ${props.number}` : undefined}
		>
			{body}
		</a>
	) : (
		<span
			ref={(e: any) => applyEscapeProps(e, props)}
			id={props.id}
			className={cls}
			style={props.style}
			aria-label={variant === 'number' ? `Citation ${props.number}` : undefined}
		>
			{body}
		</span>
	);
}
