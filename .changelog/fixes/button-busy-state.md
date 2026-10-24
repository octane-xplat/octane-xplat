### Loading buttons now report busy and keep their accessible name

A `Button` that is `isLoading` or has an in-flight `clickAction` on web now
exposes `aria-busy="true"`, stays disabled (unless `isInterruptible`), keeps
its label rendered — hidden beneath the spinner so width and accessible name
survive — and announces "Loading" through a visually hidden
`role="status"` live region.

```tsx
<Button label="Save" clickAction={save} />
// while pending: aria-busy="true", aria-disabled, live region reads "Loading"
```

Previously the loading swap replaced the content entirely, collapsing the
button's width and dropping its accessible name. See
[Button](https://octane-xplat.dev/app/components/).
