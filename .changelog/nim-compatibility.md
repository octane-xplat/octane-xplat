### Preserve the native CLI channel during compatibility checks

Compatibility checks accept an exact CLI Nim prerelease for the same framework
release and still require its installed version to match. The reference upgrade
planner preserves that CLI choice; conflicting shared catalogs or overrides stop
before writes. Other framework/compiler version checks remain strict.

After an experimental prerelease is published, save its exact version:

```sh
bun add --dev --exact @octane-xplat/cli@nim
```

Native doctor and upgrade command execution remain pending. See
[native CLI setup](https://octane-xplat.goddardai.org/package-cli#experimental-nim-executable)
for the implemented scope.
