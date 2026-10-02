/** @jsxImportSource @octane-xplat/macos-renderer */
import type { ThumbnailProps } from './props';
import { cx } from './cx';
import { Icon } from './Icon.macos.tsrx';
import { ActivityIndicator } from './controls.macos.tsrx';
import { Skeleton } from './Skeleton.macos.tsrx';
import { Tooltip } from './Tooltip.macos.tsrx';
import { isRenderable } from './is-renderable';

const SIZE = 40;

/** Thumbnail — macOS leaf. No image error events on the AppKit host, so a
 *  failed `src` shows an empty frame (documented gap vs the web/native
 *  placeholder fallback). Remove button follows the same hover contract —
 *  the renderer's NSTrackingArea drives it. */
export function Thumbnail(props: ThumbnailProps) @{
	const isLoading = props.isLoading ?? false;
	const isDisabled = props.isDisabled ?? false;
	const hasImage = props.src != null && props.src !== '';
	const label = props.label ?? props.alt;

	const inner = isLoading && props.src == null ? (
		<Skeleton className="vx-thumbnail-skeleton" width={SIZE} height={SIZE} />
	) : (
		<>
			{hasImage ? (
				<image
					src={props.src}
					stretch="aspectFill"
					accessible={props.alt != null}
					accessibilityLabel={props.alt}
					style={{ width: SIZE, height: SIZE }}
				/>
			) : (
				<Icon name="xplat-doc-image" size={20} />
			)}
			{isLoading && props.src != null ? (
				<flexboxlayout
					justifyContent="center"
					alignItems="center"
					style={{ width: SIZE, height: SIZE }}
				>
					<ActivityIndicator busy={true} style={{ width: 16, height: 16 }} />
				</flexboxlayout>
			) : null}
			{isRenderable(props.onRemove) ? (
				<flexboxlayout
					className={cx('vx-thumbnail-remove')}
					horizontalAlignment="right"
					verticalAlignment="top"
					width={16}
					height={16}
					justifyContent="center"
					alignItems="center"
					style={{ borderRadius: 8, margin: 2, backgroundColor: '#0a0a0a' }}
					accessible={true}
					accessibilityRole="button"
					accessibilityLabel="Remove"
					onTap={() => {
						if (!isDisabled) {
							props.onRemove?.();
						}
					}}
				>
					<Icon name="xplat-clear" size={10} color="#ffffff" />
				</flexboxlayout>
			) : null}
		</>
	);

	const content = (
		<gridlayout
			id={props.id}
			className={cx('vx-thumbnail', props.className)}
			width={SIZE}
			height={SIZE}
			style={props.style}
			accessible={true}
			accessibilityLabel={label}
			accessibilityRole={isRenderable(props.onPress) ? 'button' : 'image'}
			onTap={isRenderable(props.onPress) && !isDisabled ? () => props.onPress?.() : undefined}
		>
			{inner}
		</gridlayout>
	);

	return props.label != null ? (
		<Tooltip trigger={content} content={props.label} />
	) : (
		content
	);
}
