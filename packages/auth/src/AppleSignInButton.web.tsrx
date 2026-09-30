import { appleAuth } from './apple.web';
import type { AppleSignInButtonProps, SignInResult } from './types';

const LABELS = {
	default: 'Sign in with Apple',
	signUp: 'Sign up with Apple',
	continue: 'Continue with Apple',
} as const;

const THEMES = {
	black: { background: '#000', color: '#fff', border: '1px solid #000' },
	white: { background: '#fff', color: '#000', border: '1px solid #fff' },
	whiteOutline: { background: '#fff', color: '#000', border: '1px solid #000' },
} as const;

/** Sign in with Apple button — web leaf. Apple's JS API renders official
 *  markup only through its own stylesheet hooks, so this is a styled fallback
 *  matching Apple's published button spec; the click runs the popup flow via
 *  `appleAuth.signIn()` and reports through `onResult`. */
export function AppleSignInButton(props: AppleSignInButtonProps) @{
	const theme = THEMES[props.theme ?? 'black'];

	<button
		type="button"
		id={props.id}
		className={props.className}
		disabled={props.disabled}
		style={{
			display: 'inline-flex',
			alignItems: 'center',
			justifyContent: 'center',
			gap: 6,
			minHeight: 40,
			padding: '0 16px',
			borderRadius: 6,
			fontFamily: "-apple-system, 'Helvetica Neue', Helvetica, Arial, sans-serif",
			fontSize: 15,
			cursor: props.disabled ? 'default' : 'pointer',
			...theme,
			...props.style,
		}}
		onClick={() => {
			props.onPress?.();
			if (props.onResult) {
				void appleAuth.signIn().then((result: SignInResult) => props.onResult?.(result));
			}
		}}
	>
		<svg width="15" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
			<path d="M15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09z" />
		</svg>
		{LABELS[props.type ?? 'default']}
	</button>
}
