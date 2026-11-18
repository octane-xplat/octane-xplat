### Build one platform by name

Pass a platform to `xplat build` the same way you do for `xplat dev`. New apps use `xplat` for their web and mobile dev and build scripts. Use `--targets` when you want to build several platforms together.

```sh
xplat build ios
xplat build --targets web,android
```

[CLI guide](https://octane-xplat.goddardai.org/packages/cli)
