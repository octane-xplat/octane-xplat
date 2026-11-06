---
hype: 20
---

### Catch mistyped creator options

**Breaking change:** `create-octane-xplat` now stops with an error when it gets
an option it doesn't know or more than one project folder. Before, it
ignored them and scaffolded with the defaults. For example, a typo used to
create an app for every platform:

```sh
bun create octane-xplat my-app --target web
# ✗ Unknown option '--target'. …
```

Use the documented spelling instead:

```sh
bun create octane-xplat my-app --targets web
```
