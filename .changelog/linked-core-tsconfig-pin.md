---
hype: 40
---

### One NativeScript type identity when linking framework source

Apps that point `link:`, `file:` or `portal:` dependencies at a framework
checkout could see two `@nativescript/core` type identities — one from the
app, one from the checkout's own install — and fail typechecks on
`View`/`Page`/`Color`. New native apps now pin core to the app's install in
the generated `tsconfig.json`, and `xplat add` merges the pin without
replacing authored mappings. `doctor` no longer counts a checkout's private
copies as duplicate runtimes and warns when a linked app lacks the pin:

```json
{
	"compilerOptions": {
		"paths": {
			"@nativescript/core": ["./node_modules/@nativescript/core"],
			"@nativescript/core/*": ["./node_modules/@nativescript/core/*"]
		}
	}
}
```

See [working against a local checkout](https://octane-xplat.goddardai.org/package-cli#working-against-a-local-checkout).
