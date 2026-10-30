### Name web dialogs from visible text

Web overlays can now use visible title and description elements to name and
describe their dialog, through `accessibilityLabelledBy` and
`accessibilityDescribedBy`. Native hosts continue to use `accessibilityLabel`.

```tsx
<Overlay open isModal accessibilityLabelledBy="gallery-title">
	<h2 id="gallery-title">Trip photos</h2>
</Overlay>
```

See [Overlay documentation](https://octane-xplat.goddardai.org/components#overlays).
