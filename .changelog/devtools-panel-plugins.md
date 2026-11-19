### Add your own devtools tab

A package can add tabs to the native devtools window. In its package manifest, set `octaneXplat.devtoolsPanel` to an export subpath whose module default-exports a `defineDevtoolsPanel` result. Use an array for multiple tabs.

```json
{
  "octaneXplat": {
    "devtoolsPanel": "./devtools"
  }
}
```

[Add a panel plugin](https://octane-xplat.goddardai.org/package-devtools#add-a-panel-plugin)
