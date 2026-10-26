### ToggleButtonGroup renders and matches Astryx's pill layout

`ToggleButtonGroup` produced an empty render — every platform variant
accessed `Context.Provider`, which Octane's `createContext` removed (the
context itself is the provider). The group now renders its
`ToggleButton` children on web, native, and macOS.

The web look now follows Astryx: the group is a row of separated ghost
pills on a `--spacing-1` gap rather than the segmented `ButtonGroup` strip,
the pressed fill is `--color-overlay-pressed`, and the pressed label goes
semibold with a hidden twin reserving the wider width so toggling doesn't
shift the row. Group members no longer run `pressedChangeAction` — inside
a group, selection belongs to `value`/`onChange`.

```tsx
<ToggleButtonGroup label="Filter" value={tab} onChange={setTab}>
	<ToggleButton value="all" label="All" size="lg" />
	<ToggleButton value="themes" label="Themes" size="lg" />
</ToggleButtonGroup>
```

See [the ToggleButton block templates](https://github.com/facebook/astryx/tree/main/packages/cli/assets/templates/blocks/components/ToggleButtonGroup) for the upstream contract.
