### Build web apps with the experimental Nim CLI

The experimental Nim CLI can build web apps on macOS, Linux and Windows 11 x64
using the project’s installed build package, Vite and plugins. Windows is qualified
with Bun 1.4.4. Run a foreground build or start a background job,
then inspect its status and captured output. Cancellation releases the owned
build processes and preserves previous route files. On Windows, launch from
PowerShell or a Bun script; background owners are not qualified to survive a
Windows Turbo task finishing. Other native platform engines remain in progress.

```sh
xplat build --targets web
xplat runtime build --platform web --json
# Replace JOB_ID with the returned job id:
xplat job status JOB_ID --json
xplat diagnostics --job JOB_ID --json
```

See the [native executable guide](https://octane-xplat.goddardai.org/package-cli#experimental-nim-executable).
