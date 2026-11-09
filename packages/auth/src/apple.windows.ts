// Windows leaf — Sign in with Apple ships no Windows SDK surface; report the
// provider unsupported (matching the contract's Android behavior) instead of
// importing @nativescript/apple-sign-in.
import type { AppleAuth, SignInResult } from './types'

const unavailable: SignInResult = {
  status: 'error',
  message: 'Sign in with Apple is not supported on windows',
}

/** Apple Sign-In service facade — unsupported on Windows. */
export const appleAuth: AppleAuth = {
  supported: false,
  configure: () => {},
  signIn: async () => unavailable,
  getCredentialState: async () => 'unknown',
}
