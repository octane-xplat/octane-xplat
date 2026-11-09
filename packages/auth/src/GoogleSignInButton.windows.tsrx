/** @jsxImportSource @octane-xplat/jsx */
import { googleAuth } from './google'
import type { GoogleSignInButtonProps, SignInResult } from './types'

/** Google Sign-In button — a plain fallback button on Windows (no provider
 *  SDK); a tap starts `googleAuth.signIn()` and `onResult` reports the
 *  unsupported-provider error. */
export function GoogleSignInButton(props: GoogleSignInButtonProps): unknown @{
  const run = () => {
    props.onPress?.()
    if (props.onResult) {
      googleAuth.signIn().then((result: SignInResult) => props.onResult?.(result))
    }
  }

  <button
    id={props.id}
    className={props.className}
    style={props.style}
    text="Sign in with Google"
    isEnabled={props.disabled !== true}
    onTap={run}
  />
}
