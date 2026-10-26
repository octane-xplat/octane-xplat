// Table slot descriptors — plugins hand render contributions to the Table
// leaves as { component, props } pairs instead of JSX elements. The universal
// compiler only lowers JSX inside top-level component declarations, so the
// plugin hooks (ordinary exported functions) cannot author elements; the
// leaves instantiate descriptors inside their own component bodies.

const TABLE_SLOT = Symbol.for('xplat.tableSlot')

export interface TableSlotDescriptor {
	readonly [TABLE_SLOT]: true
	readonly component: any
	readonly props: any
}

export function tableSlot(component: any, props?: any): any {
	return { [TABLE_SLOT]: true, component, props }
}

export function isTableSlot(value: any): value is TableSlotDescriptor {
	return value != null && value[TABLE_SLOT] === true
}

/** Renders a slot value: descriptors become their component, arrays recurse,
 *  and ordinary renderables pass through untouched. */
export function TableSlot(props: { value: any }) @{
	const value = props.value
	if (isTableSlot(value)) {
		const Component = value.component
		return <Component {...value.props} />
	}
	if (Array.isArray(value)) {
		return value.map((item, index) => <TableSlot key={index} value={item} />)
	}
	return value as any
}
