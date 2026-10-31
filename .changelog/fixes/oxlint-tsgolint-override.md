### Carry the compatible lint checker into generated workspaces

New app and library starters now pin `oxlint-tsgolint` 7.0.2005 through the
managed workspace overrides, matching the `>=7.0.2005` optional peer that
Oxlint 1.90.0 declares through `@octane-xplat/lint`. An isolated install could
previously resolve 7.0.2002 and fail `pnpm peers check`. `xplat upgrade`
reconciles the same pin in existing workspaces.

[Component libraries](https://octane-xplat.goddardai.org/app/component-libraries)
