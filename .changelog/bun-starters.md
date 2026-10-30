### Create and maintain apps with Bun

**Breaking change:** new apps and libraries use Bun 1.4.4 for installation
and project commands. Their `package.json` owns catalogs and patch registrations;
local patch files are ready before the first install.

```sh
bun create octane-xplat my-app
cd my-app
bun run dev
```

`xplat upgrade` and `xplat doctor` support the Bun setup. `xplat add` now requires
a Bun project. Native fingerprints also accept Bun lockfiles. `xplat patches`
retains pnpm support.

[Create your first app](https://octane-xplat.goddardai.org/toolchain)
