### Use Octane 0.17 with its matching compiler

The managed toolchain now pairs Octane 0.17.0 with OXC 0.23.0 and the Octane Vite plugin 0.6.0. Editor bindings use the matching runtime generation, and native/macOS components use explicit template fragments accepted by the newer compiler.

Follow the [framework upgrade workflow](https://octane-xplat.goddardai.org/toolchain#upgrade-framework-packages) to update the version set and patches together:

```sh
bunx @octane-xplat/cli@latest upgrade
bun run xplat doctor
```
