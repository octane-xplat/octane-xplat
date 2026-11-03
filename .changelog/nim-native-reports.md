### Read native macOS crash reports with the experimental CLI

Nim session diagnostics can now associate local macOS crash reports with recorded
app processes and retain complete originals after the workspace owner exits.
Availability and confirmed/candidate association are reported separately from logs.

```sh
xplat diagnostics --session SESSION_ID --json
xplat diagnostics --session SESSION_ID --report REPORT_ID --json
```

Use a returned session/report id. See [macOS session diagnostics](https://octane-xplat.goddardai.org/package-macos-build#start-a-development-session)
for report limits and association details.
