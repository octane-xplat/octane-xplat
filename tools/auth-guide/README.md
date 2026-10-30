# Authentication guide API

Private maintained API and regression fixtures for the
[sign-in guide](../../docs/app/authentication.md). The API verifies RS256 access
tokens using `jose` and the configured Auth0 issuer. Its only data endpoint is
`GET /api/me`, which returns the verified token's own subject.

## Run the local API

From this directory, copy `.env.example` to `.env` and replace the tenant and
audience with values registered in your own test project. No client secret or
signing key belongs in this server configuration. Start the API:

```sh
bun run dev
```

It listens only on `127.0.0.1:8788`. An anonymous request returns 401. Use the
public guide to register the provider and configure the phone app. This loopback
listener is a development server; deploy the Fetch handler behind HTTPS for
physical devices and production. It is not a general application backend.

## Verify the examples

From the framework repository root:

```sh
bun run turbo run test typecheck --filter=@xplat/auth-guide
bun run turbo run test typecheck --filter=@octane-xplat/auth
```

The tests sign real JWTs with local test keys, reject invalid signatures/claims,
and exercise the guide account controller's restoration and sign-out races.
They use no real tenant or user credentials. The auth package separately checks
the maintained Auth0 adapter and the underlying hosted-client lifecycle.
The tests do not establish real provider, OS-dialog or secure-storage behavior.

Copy `src/api.ts` and `src/serve.ts` into an independent Node project with
`jose@6` to use the server outside the monorepo; the guide gives the complete
configuration and launch commands. The example account UI and session controller
live in `packages/demos/src/auth-guide`; they are app-owned example files,
not a supported framework API.
