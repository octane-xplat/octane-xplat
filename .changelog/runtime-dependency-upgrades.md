### Updated runtime dependencies

**Breaking change:** Apps now use Octane 0.16.3 and require Node.js 22.22.2 or
newer. Update Node before creating or upgrading an app. The supported compiler
and runtime versions move together through `xplat upgrade`.

```sh
pnpm dlx @octane-xplat/cli@latest upgrade
pnpm install
```

See the [toolchain setup](https://github.com/octane-xplat/octane-xplat/blob/main/docs/start/toolchain.md).
