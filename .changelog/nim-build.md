### Build web apps with the experimental Nim CLI

The experimental Nim CLI can build web apps on macOS using the project's
installed Vite and plugins. Run a foreground build or start a background job,
then inspect its status and captured output. Cancellation releases the owned
build processes. Other build platforms and development sessions remain in progress.

```sh
xplat build --targets web
xplat runtime build --platform web --json
# Replace JOB_ID with the returned job id:
xplat job status JOB_ID --json
xplat diagnostics --job JOB_ID --json
```

See the [native executable guide](https://octane-xplat.goddardai.org/package-cli#experimental-nim-executable).
