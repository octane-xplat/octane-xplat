### Upgrade to Octane 0.23.2

The managed toolchain pairs Octane 0.23.2 with `@tsrx/oxc` 0.24.0 and the Octane Vite plugin 0.6.6. Upgrade the packages and patches from your app directory, then rebuild your app. Output compiled with Octane versions before 0.22 imports helpers from paths that have changed.

```sh
bunx @octane-xplat/cli@latest upgrade
bun run xplat doctor
```

[Upgrade framework packages](https://octane-xplat.goddardai.org/toolchain#upgrade-framework-packages)
