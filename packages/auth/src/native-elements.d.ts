import { SignInButton } from '@nativescript/apple-sign-in'
import { GoogleSignInButton } from '@nativescript/google-signin'
import type { Attributes } from '@nativescript-community/octane/intrinsics'

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		applesigninbutton: Attributes<typeof SignInButton>
		googlesigninbutton: Attributes<typeof GoogleSignInButton>
	}
}
