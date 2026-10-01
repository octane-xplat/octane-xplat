/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef, useState } from 'octane';
import type { ThumbnailProps } from './props';
import { cx } from './cx';
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props';
import { Icon } from './Icon.tsrx';
import { Pressable } from './Pressable.tsrx';
import { ActivityIndicator } from './ActivityIndicator.tsrx';
import { Skeleton } from './Skeleton.tsrx';
import { Tooltip } from './Tooltip';
import { isRenderable } from './is-renderable';

const SIZE = 40;

let warnedMissingName = false;

/** Thumbnail — square image preview. `isLoading` shows a Skeleton without
 *  `src`, an ActivityIndicator overlay over `src`. Load failure falls back to the
 *  placeholder (NS Image's isLoading→false with no imageSource). On touch
 *  targets the remove button is always visible — there is no hover state. */
export function Thumbnail(props: ThumbnailProps) @{
	const isLoading = props.isLoading ?? false;
	const isDisabled = props.isDisabled ?? false;
	const [failed, setFailed] = useState(false);
	const image = useRef<any>(null);
	const hasImage = props.src != null && props.src !== '' && !failed;
	const label = props.label ?? props.alt;

	if (
		!warnedMissingName &&
		props.src != null &&
		props.alt == null &&
		props.label == null
	) {
		warnedMissingName = true;
		console.warn(
			'[octane-xplat] Thumbnail: `src` without `alt` or `label` renders an unnamed group — pass `alt=""` for decorative images.',
		);
	}

	// NS Image reports progress via isLoadingChange only; a finished load with
	// no imageSource means the src failed.
	useEffect(() => {
		const view = image.current;
		if (!hasImage || !view) {
			return;
		}

		setFailed(false);
		const onLoading = () => {
			if (!view.isLoading && !view.imageSource) {
				setFailed(true);
			}
		};

		view.on?.('isLoadingChange', onLoading);
		return () => view.off?.('isLoadingChange', onLoading);
	}, [props.src, hasImage]);

	const inner = isLoading && props.src == null ? (
		<Skeleton className="vx-thumbnail-skeleton" width={SIZE} height={SIZE} />
	) : (
		<>
			{hasImage ? (
				<image
					ref={(v: any) => {
						image.current = v;
					}}
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
					className="vx-thumbnail-overlay"
					justifyContent="center"
					alignItems="center"
					style={{ width: SIZE, height: SIZE }}
				>
					<ActivityIndicator busy={true} style={{ width: 16, height: 16 }} />
				</flexboxlayout>
			) : null}
			{isRenderable(props.onRemove) ? (
				<gridlayout horizontalAlignment="right" verticalAlignment="top" width={16} height={16} style={{ margin: 2 }}>
				<Pressable
					className={cx(
						'vx-thumbnail-remove',
						// Touch targets have no hover — 'hover' still shows it.
						props.showRemoveOn !== 'always' && 'vx-thumbnail-remove--touch',
					)}
					justifyContent="center"
					alignItems="center"
					style={{ borderRadius: 8 }}
					accessible={true}
					accessibilityRole="button"
					accessibilityLabel="Remove"
					disabled={isDisabled}
					onPress={() => props.onRemove?.()}
				>
					<Icon name="xplat-clear" size={10} />
				</Pressable>
				</gridlayout>
			) : null}
		</>
	);

	const content = (
		<gridlayout
			ref={(v: any) => applyEscapeProps(v, props)}
			id={props.id}
			className={cx('vx-thumbnail', props.className)}
			width={SIZE}
			height={SIZE}
			style={props.style}
			accessible={true}
			accessibilityLabel={label}
			accessibilityRole={nativeAccessibilityRole(isRenderable(props.onPress) ? 'button' : 'image') as any}
			accessibilityState={nativeAccessibilityState({ disabled: isDisabled }) as any}
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
