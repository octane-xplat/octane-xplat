### Keep hidden Text hidden after iOS layout

On iOS, `Text` with `visibility: 'hidden'` still takes up space and now stays invisible after layout or text changes.

```tsx
<Text style={{ visibility: showFeedback ? 'visible' : 'hidden' }}>+10s</Text>
```

See [styling](https://octane-xplat.goddardai.org/styling).
