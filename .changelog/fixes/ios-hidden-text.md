### Keep hidden Text hidden after iOS layout

On iOS, `Text` with `visibility: 'hidden'` now keeps its layout space and its native drawing state suppressed after layout and text updates.

```tsx
<Text style={{ visibility: showFeedback ? 'visible' : 'hidden' }}>+10s</Text>
```

See [styling](https://octane-xplat.goddardai.org/app/styling).
