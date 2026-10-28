/** @jsxImportSource @octane-xplat/jsx */
import { cx } from '@octane-xplat/lib'
import type { LinkProps } from './props'
import { Pressable } from './Pressable.macos.tsrx'
import { TextSlot } from './text-slot'
import { followHref } from './nav-href'
import { useLinkComponent } from './use-link-component.tsrx'
import { sanitizeUrl } from './safe-url'
import { mergeStyle } from './style-merge'

export function Link(props: LinkProps) @{
	const Injected: any = useLinkComponent(props.as)
	const url = sanitizeUrl(props.href)
	const className = cx('vx-link', 'vx-link--appkit', props.isStandalone && 'vx-link--standalone',
		props.hasUnderline && 'vx-link--underline', props.isExternalLink && 'vx-link--external', props.className)
	const style = mergeStyle(props.color ? { color: props.color } : {}, props.style)
	// Match the safe-link boundary: rejected destinations never reach an
	// injected router component. A valid injected surface owns navigation.
	if (typeof Injected === 'function' && url != null) {
		return <Injected id={props.id} href={url} onPress={props.onPress}
			className={className} style={style}>{props.children}</Injected>
	}
	<Pressable id={props.id} className={className} style={style}
		accessibilityRole={props.accessibilityRole ?? 'link'}
		onPress={() => { props.onPress?.(); followHref(props.href) }}>
		<TextSlot className={cx(props.hasUnderline && !props.isStandalone && 'vx-link--underline')}>{props.children}</TextSlot>
		{props.isExternalLink ? <label className="vx-link-external" text="↗" accessible={false} /> : null}
	</Pressable>
}

<style>
	.vx-link--appkit {
		flex-direction: row;
		align-items: center;
	}
</style>
