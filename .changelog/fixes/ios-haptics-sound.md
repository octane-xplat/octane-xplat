### Keep iOS haptics silent in Debug builds

Advanced iOS haptics no longer synthesize audible thumps when using the prepared Pulsar package. Disabling simulation leaves another service's audio session active. Existing apps must replace the remote Pulsar Swift package with the prepared local package and rebuild their native binary.

```sh
bun run xplat-prepare-haptics-ios .xplat/pulsar-ios
```

Follow the [iOS haptics setup](https://octane-xplat.goddardai.org/package-haptics#set-up-ios) to update the NativeScript configuration.
