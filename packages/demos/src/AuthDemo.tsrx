import { useState } from 'octane';
import { Heading, Text, View } from '@octane-xplat/ui';
import { AppleSignInButton, GoogleSignInButton, appleAuth, googleAuth } from '@octane-xplat/auth';
import type { SignInResult } from '@octane-xplat/auth';

function summarize(result: SignInResult | null): string {
	if (!result) return 'no attempt yet';
	if (result.status === 'success') {
		const c = result.credential;
		return `signed in: ${c.user.name ?? c.user.email ?? c.user.id} (${c.provider}, idToken ${c.idToken ? 'yes' : 'no'})`;
	}

	return result.status === 'cancelled' ? 'cancelled' : `error: ${result.message}`;
}

/** Shared provider sign-in demo — the real provider buttons on iOS/Android
 *  (@nativescript/apple-sign-in, @nativescript/google-signin) and the web SDK
 *  buttons in the browser, all behind one API. Unconfigured providers surface
 *  their setup errors through the same SignInResult shape. */
export function AuthDemo() @{
	const [result, setResult] = useState<SignInResult | null>(null);

	<View className="gap-4">
		<Heading level={2}>Provider sign-in</Heading>
		<Text>
			Native SDKs on iOS/Android (Apple needs the signin entitlement, Google
			a configured client id); web loads Apple JS + Google Identity Services
			lazily after configure(). AppKit uses native Apple authentication and
			a configured Google hostedFlow through the system browser. Apps exchange the returned credential
			server-side — the leaf only acquires it.
		</Text>
		<Text>{`appleAuth.supported: ${appleAuth.supported} — googleAuth.supported: ${googleAuth.supported}`}</Text>
		<AppleSignInButton id="auth-apple-button" theme="black" onResult={setResult} />
		<GoogleSignInButton id="auth-google-button" theme="auto" onResult={setResult} />
		<Text id="auth-result">{summarize(result)}</Text>
	</View>
}
