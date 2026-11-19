### Hover cards open when their trigger becomes available

On web, a `HoverCard` set to open on its first render now appears as soon as its trigger is available.

```tsx
<HoverCard isOpen content={<Text>Account details</Text>}>
  <Button label="Account" />
</HoverCard>
```

See [hover cards and layers](https://octane-xplat.goddardai.org/components).
