/** @jsxImportSource @nativescript-community/octane */
import { useContext } from 'octane';
import type { MetadataListItemProps } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';
import { MetadataListContext } from './metadata-list-context';
import { isRenderable } from './is-renderable';

function childContent(children: any, className: string, style?: any) @{
	if (typeof children === 'string' || typeof children === 'number') {
		return <label className={className} whiteSpace="normal" style={style}>{children}</label>;
	}

	return <flexboxlayout className={className} style={style}>{children}</flexboxlayout>;
}

/** One label/value item. 'start' emits two adjacent grid cells (label track,
 *  value track) so the parent Grid aligns labels across items; 'top' and
 *  horizontal emit a single stacked cell. */
export function MetadataListItem(props: MetadataListItemProps) @{
	const ctx = useContext(MetadataListContext);
	const isStacked =
		(ctx?.labelPosition ?? 'start') === 'top' || ctx?.orientation === 'horizontal';

	const labelRow = (
		<flexboxlayout
			className="vx-metadatalist-label"
			flexDirection="row"
			alignItems="center"
			gap={6}
			style={ctx?.labelWidth != null ? ({ width: ctx.labelWidth } as any) : undefined}
		>
			{isRenderable(props.icon) ? props.icon : null}
			<label className="vx-metadatalist-label-text" whiteSpace="normal">{props.label}</label>
		</flexboxlayout>
	);

	if (isStacked) {
		return (
			<flexboxlayout
				ref={(v: any) => applyEscapeProps(v, props)}
				id={props.id}
				className={cx('vx-metadatalist-item', props.className)}
				style={{ flexDirection: 'column', marginBottom: 8, ...props.style }}
				flexDirection="column"
			>
				{labelRow}
				{childContent(props.children, 'vx-metadatalist-value')}
			</flexboxlayout>
		);
	}

	return (
		<>
			{labelRow}
			{childContent(props.children, 'vx-metadatalist-value', { marginBottom: 8 })}
		</>
	);
}
