### Inspect native session and job state

The experimental Nim CLI now retains session and job state in an authenticated
workspace owner on macOS. Session list/status/end and job status/cancel connect
to that owner; reads leave no background process behind when none exists.
Other native build platforms remain in progress.

```sh
xplat session list --json
```

See the [native executable guide](https://octane-xplat.goddardai.org/package-cli#experimental-nim-executable).
