### Bamboo utilities accept every UI theme token

`@octane-xplat/bamboo` utilities now accept every design token the shared UI
theme defines — colors like `warning`, `border`, and the `syntax-*` palette,
plus the `container` radius — instead of the previous short list. Token names
are the theme's CSS variables without the prefix, so values come from
`@octane-xplat/ui/theme/chrome.css` or your own `:root, .ns-root` definitions.

```ts
css({ color: 'warning', borderColor: 'border', borderRadius: 'container' })
```

[Styling](https://octane-xplat.dev/app/styling/)
