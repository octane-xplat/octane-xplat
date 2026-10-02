/** @jsxImportSource @nativescript-community/octane */
import type { ChatComposerToken, ChatComposerTokenCustom } from './props';
import { cx } from './cx';
import { Icon } from './Icon';

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
	<flexboxlayout
		className={cx('vx-chattoken', `vx-chattoken--${variant}`, props.className)}
		flexDirection="row"
		alignItems="center"
	>
		{token.icon ? <Icon name={token.icon} size={12} /> : null}
		<label className="vx-chattoken-label" text={typeof token.label === 'string' ? token.label : ''} textWrap={false} />
		{typeof token.label === 'string' ? null : token.label}
	</flexboxlayout>
}
