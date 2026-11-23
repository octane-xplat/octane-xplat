// App-owned transport: provide real HTTPS backend operations, never a Google
// client secret in this file. See README.md for the server requirements.
import type { AuthCredential, GoogleHostedAuthFlow } from '@octane-xplat/auth'

type Attempt = { attemptId: string; url: string; callbackScheme: string }

export interface GoogleHostedBackend {
  begin(options: Parameters<GoogleHostedAuthFlow['createRequest']>[0]): Promise<Attempt>
  // The backend authenticates the app session, checks callback host/path and
  // state, consumes the attempt/code once, and verifies Google's token.
  complete(request: { attemptId: string; callbackURL: string }): Promise<AuthCredential>
  signOut(): Promise<void>
}

/** Wire your authenticated backend transport into googleAuth.configure. */
export function createGoogleHostedFlow(backend: GoogleHostedBackend): GoogleHostedAuthFlow {
  // 1. Keep the server's attempt identifier only while sign-in is active.
  let attemptId: string | undefined

  return {
    async createRequest(options) {
      // 2. Ask the backend for a new authorization URL and remember its attempt.
      // Cancellation does not call complete; expire unused attempts server-side.
      attemptId = undefined

      const attempt = await backend.begin(options)

      attemptId = attempt.attemptId
      return { url: attempt.url, callbackScheme: attempt.callbackScheme }
    },
    async complete(callbackURL) {
      // 3. Consume the local attempt before sending the callback to the backend.
      const id = attemptId

      attemptId = undefined
      if (!id) {
        throw new Error('No Google sign-in attempt is active')
      }

      return backend.complete({ attemptId: id, callbackURL })
    },
    async signOut() {
      // 4. Clear the attempt and end the backend session.
      attemptId = undefined
      await backend.signOut()
    },
  }
}
