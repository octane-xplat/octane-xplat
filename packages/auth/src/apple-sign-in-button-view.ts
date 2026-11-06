// The plugin's SignInButton wraps ASAuthorizationAppleIDButton — iOS only,
// absent from the plugin's Android module. Referencing that export from a
// shared module warns on Android bundles, so the iOS leaf re-exports the
// real class and the default leaf exports `undefined` for the fallback path.
export const SignInButton: undefined = undefined
