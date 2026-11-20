### Run a development action and wait for its result

Use `xplat actions run` to select a running app, invoke a declared development action, and wait for the finished job. If the wait times out or you interrupt it, use the returned job ID with `xplat actions status` to check what happened.

```sh
xplat actions run --action fixtures.set-counter --target web --input '{"count":3}' --json
```

[Run development actions from the CLI](https://octane-xplat.goddardai.org/development-actions#invoke-and-assert-through-the-cli).
