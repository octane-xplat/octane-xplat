### Invoke development actions with the experimental native CLI

On macOS, the parallel Nim CLI now lists a running app's declared actions,
invokes them through bounded jobs, and reports results, cancellation and partial
effects. Invocation validates JavaScript field contracts with the selected
project's compatible build worker and Node. Listing and status stay native.

```sh
xplat actions list --json
# Replace the identities and input with values from the live registry.
xplat actions invoke --action ACTION_ID --instance INSTANCE_ID --revision REVISION --input '{}' --request-key fixture-setup-1 --json
xplat actions status JOB_ID --json
```

See [experimental native CLI setup](https://octane-xplat.goddardai.org/package-cli#experimental-nim-executable)
and [development-action runtime coverage](https://octane-xplat.goddardai.org/development-actions).
