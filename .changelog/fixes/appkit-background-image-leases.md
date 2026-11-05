---
hype: 25
---

### Load every background image on macOS

Layered backgrounds now accept each image's completion independently. Replacing a background URL releases the previous request, and removed backgrounds ignore late image completions.

```tsx
<masonview style={{ backgroundImage: 'url(one.png), url(two.png)' }} />
```

See [macOS renderer setup](https://octane-xplat.goddardai.org/package-macos-appkit).
