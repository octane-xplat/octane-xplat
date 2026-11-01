### Give a synchronously-decoded Android Image its intrinsic height

On Android, a width-only `Image` whose bitmap arrives inside the layout pass —
a `data:` URI or a warm cache hit — stayed 0 pt high because nothing asked
layout to re-measure it. The leaf now requests one deferred re-measure while an
intrinsic axis is still 0, matching iOS sizing (`214` wide → `160.5` high for a
4:3 bitmap). Flex-grown and stretched heights are untouched.

```tsx
<Image src={dataUri} alt="Preview" style={{ width: 214 }} />
```

See [the Image component](https://github.com/octane-xplat/octane-xplat/tree/main/packages/ui#image).
