# Android controls

Current exports: `MaterialSwitch`, `SeekBar`, `CircularProgressIndicator`.

**Fix: Publish widget-specific prop types and forward the advertised disabled state.**

MaterialSwitch has the same broad SwitchProps mismatch as UISwitch: field-state props are accepted but not forwarded by the leaf. Match MaterialSwitchProps, SeekBarProps, and CircularProgressIndicatorProps to their actual OS capabilities. Keep their meaningful platform names while sharing portable value/event contracts.

Proposed shape (illustrative):

```ts
type ProposedMaterialSwitchProps = {
	checked: boolean
	disabled?: boolean
	onCheckedChange?: (checked: boolean) => void
}
```

Evidence: [src/android/index.ts:7](../../../packages/ui/src/android/index.ts#L7), [src/android/MaterialSwitch.android.tsrx:9](../../../packages/ui/src/android/MaterialSwitch.android.tsrx#L9).

[Audit index](../README.md)
