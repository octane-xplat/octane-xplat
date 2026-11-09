// Windows leaf — Google Sign-In ships no Windows SDK surface; hosted OAuth
// (createHostedFlow) is the supported path for desktop web flows. Report the
// provider unsupported instead of importing @nativescript/google-signin.
import type { GoogleAuth, SignInResult } from './types'

const unavailable: SignInResult = {
  status: 'error',
  message: 'Google Sign-In is not supported on windows',
}

/** Google Sign-In service facade — unsupported on Windows. */
export const googleAuth: GoogleAuth = {
  supported: false,
  configure: async () => {},
  signIn: async () => unavailable,
  signOut: async () => {},
}
