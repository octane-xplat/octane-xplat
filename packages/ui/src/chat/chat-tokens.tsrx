/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../internal/layout/style-merge'
import type { ChatComposerToken, ChatComposerTokenCustom } from '../props'
import { cx } from '@octane-xplat/lib'
import { Icon } from '../components/media/Icon'

/** Is this token the custom-render form? Shared by the input and the
 *  tokenized-text renderer. */
export function isCustomToken(token: ChatComposerToken): token is ChatComposerTokenCustom {
	return 'render' in token && typeof token.render === 'function'
}

/** The shared inline chip for badge-configured tokens — used by the
 *  composer input, ChatComposerTokenElement, and ChatTokenizedText. */
export function ChatTokenChip(props: {
	token: ChatComposerToken
	className?: any
}): unknown @{
	const token = props.token
	if (isCustomToken(token)) {
		return token.render()
	}

	const variant = token.variant ?? 'neutral'

	<masonview
		className={cx('vx-chat-token', `vx-chattoken--${variant}`, props.className)}
		style={mergeStyle({ display: 'flex' })}
	>
		{token.icon ? <Icon name={token.icon} size={12} /> : null}
		<label
			className="vx-chattoken-label"
			text={typeof token.label === 'string' ? token.label : ''}
			textWrap={false}
		/>
		{typeof token.label === 'string' ? null : token.label}
	</masonview>
}
