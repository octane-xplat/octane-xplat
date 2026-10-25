### Stop sending development actions to expired app instances

Apps leave the live action registry after 15 seconds without a heartbeat.
New actions cannot target an expired instance, and outstanding jobs report
`disconnected_runtime` instead of waiting for the action timeout. Check app
state before retrying an action whose outcome is unknown.

```sh
pnpm exec xplat actions list --json
```

[Development actions](https://octane-xplat.goddardai.org/testing/development-actions)
