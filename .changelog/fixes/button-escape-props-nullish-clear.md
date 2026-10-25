### No more `title="undefined"` on untooled buttons

`web` escape props carrying `null` or `undefined` now remove the reflected
attribute instead of stringifying the value. A `Button` without `tooltip` no
longer exposes `title="undefined"`, which had leaked into its accessible
name on web.

```tsx
<Button label="Save" /> // renders without a title attribute
```

See [`web` escape props](https://octane-xplat.dev/app/styling/).
