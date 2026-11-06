---
hype: 70
---

### Create apps with pnpm

`pnpm create octane-xplat my-app` scaffolds a pnpm project, and `xplat add` and
`xplat upgrade` now work inside it.

The creator still defaults to Bun. Launch it through pnpm to get a pnpm project
instead, or pass `--package-manager pnpm` to any launcher:

```sh
pnpm create octane-xplat my-app
```

A pnpm app keeps the same catalog pins, overrides, patch registrations, and
build approvals in `pnpm-workspace.yaml` instead of `package.json`, and its
patch files live in a local `patches/` directory just like a Bun app.
`xplat add` writes the new platform's entries into that YAML file and installs
with pnpm.

`xplat upgrade` now writes local `patches/` files for pnpm projects too, unless
the project already declares `@octane-xplat/patches` in `configDependencies`.
That is a behavior change for pnpm projects that had neither local patches nor
the config dependency: they get local patch files instead of the config package.
