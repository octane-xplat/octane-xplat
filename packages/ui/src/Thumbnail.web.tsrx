import { useLinkedState } from 'octane'
import { useImageMode } from './use-image-mode.web.tsrx'
import type { ThumbnailProps } from './props'
import { applyEscapeProps } from './escape-props'
import { Tooltip } from './Tooltip.web.tsrx'
import { Skeleton } from './Skeleton.web.tsrx'
import { ActivityIndicator } from './ActivityIndicator.web.tsrx'
import { Icon } from './Icon.web.tsrx'
import { isRenderable } from './is-renderable'

const SIZE = 40

let warnedMissingName = false

/** Thumbnail — a 40px square image preview. `src` failure (or none) falls
 *  back to a placeholder glyph; `isLoading` shows a skeleton without `src`
 *  and a spinner overlay with it. `onRemove` overlays a remove affordance —
 *  'hover' reveals it on hover/focus, 'always' keeps it visible. An empty
 *  `alt` is explicitly decorative; a missing one dev-warns unless `label`
 *  (or web aria attrs) names the group. */
export function Thumbnail(props: ThumbnailProps) @{
	const isLoading = props.isLoading ?? false
	const isDisabled = props.isDisabled ?? false
	const showRemoveOn = props.showRemoveOn ?? 'hover'
	const [failed, setFailed] = useLinkedState(props.src, () => false)
	const imageMode = useImageMode(props.onRemove && !failed ? props.src : null, {
		region: { x: 0.5, y: 0, width: 0.5, height: 0.5 },
		fallback: 'dark',
	})

	const hasImage = props.src != null && props.src !== '' && !failed

	if (
		!warnedMissingName &&
		props.src != null &&
		props.alt == null &&
		props.label == null &&
		props.web?.['aria-label'] == null &&
		props.web?.['aria-labelledby'] == null
	) {
		warnedMissingName = true
		console.warn(
			'[octane-xplat] Thumbnail: `src` without `alt`, `label`, or another accessible name renders an unnamed group — pass `alt=""` for decorative images.',
		)
	}

	const content = hasImage ? (
		<img
			className="vx-thumbnail-image"
			src={props.src}
			alt={props.alt ?? ''}
			aria-hidden={props.alt == null ? 'true' : undefined}
			onError={() => setFailed(true)}
		/>
	) : (
		<div className="vx-thumbnail-placeholder" aria-hidden="true">
			<Icon name="xplat-doc-image" size={20} />
		</div>
	)

	const overlay =
		isLoading && props.src != null ? (
			<div className="vx-thumbnail-overlay" aria-hidden="true">
				<ActivityIndicator busy={true} style={{ width: 16, height: 16 }} />
			</div>
		) : null

	const removeButton = isRenderable(props.onRemove) ? (
		<button
			type="button"
			className={[
				'vx-thumbnail-remove',
				showRemoveOn === 'always' && 'vx-thumbnail-remove--always',
			]}
			aria-label="Remove"
			data-xds-image-mode={imageMode}
			disabled={isDisabled}
			onClick={(e: any) => {
				e.stopPropagation()
				props.onRemove?.()
			}}
		>
			<Icon name="xplat-clear" size={12} />
		</button>
	) : null

	const inner =
		isLoading && props.src == null ? (
			<Skeleton className="vx-thumbnail-skeleton" width={SIZE} height={SIZE} />
		) : (
			<>
				{content}
				{overlay}
				{removeButton}
			</>
		)

	const interactive = isRenderable(props.onPress) && !isDisabled
	const label = props.label ?? props.alt

	const group = interactive ? (
		<div
			ref={(e: any) => applyEscapeProps(e, props)}
			id={props.id}
			role="button"
			tabIndex={0}
			className={[
				'vx-thumbnail',
				isDisabled && 'vx-thumbnail--disabled',
				isLoading && 'vx-thumbnail--loading',
				props.className,
			]}
			style={props.style}
			aria-label={label}
			onClick={() => props.onPress?.()}
			onKeyDown={(event: KeyboardEvent) => {
				if (event.target !== event.currentTarget || event.repeat) {
					return
				}

				if (event.key === 'Enter' || event.key === ' ') {
					event.preventDefault()
					props.onPress?.()
				}
			}}
		>
			{inner}
		</div>
	) : (
		<div
			ref={(e: any) => applyEscapeProps(e, props)}
			id={props.id}
			className={[
				'vx-thumbnail',
				isDisabled && 'vx-thumbnail--disabled',
				isLoading && 'vx-thumbnail--loading',
				props.className,
			]}
			style={props.style}
			role="group"
			aria-label={label}
			aria-disabled={isDisabled || undefined}
		>
			{inner}
		</div>
	)

	return props.label != null ? (
		<Tooltip className="vx-thumbnail-tooltip-anchor" trigger={group} content={props.label} />
	) : (
		group
	)
}
