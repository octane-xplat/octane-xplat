### Keep framework patches in your project

**Breaking change**

The separate `@octane-xplat/patches` package is retired. If your pnpm project used it through `configDependencies`, run the upgrade command. It removes the config dependency and updates `patchedDependencies` to point at files in your local `patches/` directory. The upgrade preserves custom patch files or reports conflicts.

```sh
pnpm dlx @octane-xplat/cli@latest upgrade
```

[Upgrade framework packages](https://octane-xplat.goddardai.org/toolchain#upgrade-framework-packages)
