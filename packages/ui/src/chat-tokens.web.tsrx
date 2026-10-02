import type { ChatComposerToken, ChatComposerTokenCustom } from './props';
import { Icon } from './Icon.web.tsrx';

/** Is this token the custom-render form? Shared by the input and the
 *  tokenized-text renderer. */
export function isCustomToken(token: ChatComposerToken): token is ChatComposerTokenCustom {
	return 'render' in token && typeof token.render === 'function';
}

/** The shared inline chip for badge-configured tokens — used by the
 *  composer input, ChatComposerTokenElement, and ChatTokenizedText. */
export function ChatTokenChip(props: { token: ChatComposerToken; className?: any }) @{
	const token = props.token;
	if (isCustomToken(token)) {
		return token.render();
	}

	const variant = token.variant ?? 'neutral';

	<span className={['vx-chat-token', `vx-chattoken--${variant}`, props.className]}>
		{token.icon ? <Icon name={token.icon} size={12} /> : null}
		{typeof token.label === 'string'
			? <span className="vx-chattoken-label">{token.label}</span>
			: token.label}
	</span>
}
