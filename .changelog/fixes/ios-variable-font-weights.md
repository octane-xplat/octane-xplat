### Variable font weights in iOS text and editors

On iOS, variable fonts now use the requested weight in class-styled text, text inputs, and text areas. Normal text selects weight 400 even when the font file defaults to a lighter weight. Explicit variation settings keep precedence.

```tsx
<Text className="font-semibold">Semibold</Text>
<TextInput className="font-medium" defaultValue="Medium" />
```

See [custom fonts and weights](https://octane-xplat.goddardai.org/app/styling#font-family-tokens).
