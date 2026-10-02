export function selectionState(view: any): string {
	const state = view.getAttribute('aria-checked')
	return state === 'true' ? 'checked' : state === 'mixed' ? 'mixed' : 'unchecked'
}

export function rowPosition(row: any, control: any): string {
	const ordinal = Number(row.getAttribute('aria-rowindex')) - 1
	const description = control.getAttribute('aria-description')
	if (description !== `Row ${ordinal} of 60`) {
		throw new Error('Row index and control description disagree')
	}

	return description
}

export function scrollBody(view: any, offset: number): void {
	view.scrollTop = offset
	view.dispatchEvent(new Event('scroll'))
}
