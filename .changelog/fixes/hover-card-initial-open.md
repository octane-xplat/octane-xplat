### Hover cards open when their trigger becomes available

On web, an initially open `HoverCard` now appears when its element trigger attaches. Layers observe trigger refs that bind after the initial render.

```tsx
<HoverCard isOpen content={<Text>Account details</Text>}>
  <Button label="Account" />
</HoverCard>
```

See [hover cards and layers](https://octane-xplat.goddardai.org/components).
