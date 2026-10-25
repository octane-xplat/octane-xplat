// Port of upstream ComplexSelector/ComplexSelectorShowcase.tsx (Astryx 0.6.4, MIT).
// The 3x3 option grid uses useGridFocus for arrow-key navigation.
import { ComplexSelector, Icon, useGridFocus } from '@octane-xplat/ui'
import { useState } from 'octane'

const DEPARTMENTS = [
	{ id: 'engineering', label: 'Engineering', icon: 'sandbox-wrench' },
	{ id: 'design', label: 'Design', icon: 'sandbox-pencil-square' },
	{ id: 'product', label: 'Product', icon: 'sandbox-view-columns' },
	{ id: 'marketing', label: 'Marketing', icon: 'sandbox-megaphone' },
	{ id: 'sales', label: 'Sales', icon: 'sandbox-chart' },
	{ id: 'hr', label: 'HR', icon: 'sandbox-user' },
	{ id: 'finance', label: 'Finance', icon: 'sandbox-calculator' },
	{ id: 'legal', label: 'Legal', icon: 'sandbox-scale' },
	{ id: 'ops', label: 'Operations', icon: 'sandbox-cog' },
]

export function ComplexSelectorShowcase() @{
	const [department, setDepartment] = useState<string | null>(null)
	const grid = useGridFocus<HTMLDivElement>({ rows: 3, columns: 3 })
	const selected = DEPARTMENTS.find((d) => d.id === department)

	<div style={{width: 480}}>
		<ComplexSelector label="Department" value={department} onChange={setDepartment} triggerLabel={selected?.label ?? 'Select department'}>
			{({ value, onChange, close }) => (
				<div ref={grid.ref} onKeyDown={grid.onKeyDown} role="listbox" style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, padding: 8, minWidth: 360}}>
					{DEPARTMENTS.map((d) => (
						<div key={d.id} role="option" aria-selected={value === d.id} data-grid-cell tabIndex={0} className="vx-menu-item" onClick={() => { onChange(d.id); close() }} onKeyDown={(e: any) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(d.id); close() } }}>
							<Icon name={d.icon as any} size={16} />
							<span className="vx-menu-item-label">{d.label}</span>
						</div>
					))}
				</div>
			)}
		</ComplexSelector>
	</div>
}
