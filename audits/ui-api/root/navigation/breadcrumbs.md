# Breadcrumbs

Current exports: `Breadcrumbs`.

**Design: Use link destinations for breadcrumb items and keep actions explicit.**

BreadcrumbItem only has label and onSelect, so agents must implement URL navigation themselves and lose ordinary link behavior. Add href or a typed route destination, mark the current item, and keep action breadcrumbs as an explicit alternative. Match BreadcrumbsProps rather than also exporting the old singular prop name.

Proposed shape (illustrative):

```ts
type ProposedBreadcrumbItem = {
	label: string
	href?: string
	current?: boolean
}
```

Evidence: [src/props.ts:3667](../../../../packages/ui/src/props.ts#L3667).

[Audit index](../../README.md)
