# Accessibility props

**Design: Use one shared accessibility contract with role-appropriate state.**

AccessibilityProps and Role are directly exported only by the macOS wildcard, although their fields recur throughout shared components. Export a deliberate common type, make accessible naming consistent, and model mixed checked state and numeric range values when relevant. Keep focusability, grouping, and hiding separate so one boolean does not carry several platform meanings.

Proposed shape (illustrative):

```ts
type ProposedAccessibilityState = {
	disabled?: boolean
	checked?: boolean | 'mixed'
	selected?: boolean
	expanded?: boolean
}
```

Evidence: [src/props.ts:301](../../../../packages/ui/src/props.ts#L301), [src/props.ts:350](../../../../packages/ui/src/props.ts#L350).

[Audit index](../../README.md)
