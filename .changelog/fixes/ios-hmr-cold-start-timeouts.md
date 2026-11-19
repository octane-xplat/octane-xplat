### Start large iOS apps with live updates on a cold dev server

Large iOS apps could time out on the first launch against a freshly started dev server while it processed large dependencies. The server now reads imports faster. It may still retry some requests on the first launch.

```sh
bun run xplat dev ios
```

[CLI guide](https://octane-xplat.goddardai.org/package-cli)
