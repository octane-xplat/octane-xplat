# iOS controls

Current exports: `UISwitch`, `UISlider`, `UIActivityIndicatorView`.

**Fix: Expose exact iOS widget props and honor every advertised state prop.**

UISwitch accepts PlatformWidgetProps<SwitchProps>, including FieldControlProps, but its leaf only forwards checked and its change callback plus basic host styling. It does not forward isDisabled or render field labels. Implement that contract or publish a smaller UISwitchProps type. Export correspondingly named UISliderProps and UIActivityIndicatorViewProps for discoverability.

Proposed shape (illustrative):

```ts
type ProposedUISwitchProps = {
	checked: boolean
	disabled?: boolean
	onCheckedChange?: (checked: boolean) => void
}
```

Evidence: [src/ios/index.ts:7](../../../packages/ui/src/ios/index.ts#L7), [src/ios/UISwitch.ios.tsrx:9](../../../packages/ui/src/ios/UISwitch.ios.tsrx#L9).

[Audit index](../README.md)
