import type { PartialFilter, PowerSearchFilter, PowerSearchItem, PowerSearchProps } from '../../props'
import type { createInternalConfig } from './power-search-config'

/** Internal resolved presentation boundary. The container owns query, suggestions,
 * and create/edit transitions; the view owns host refs and the existing platform
 * leaf selection. Token/editor props already provide their presentation seams.
 * No package-root export or new customization contract is introduced. */
export interface PowerSearchViewProps extends Omit<PowerSearchProps, 'onChange'> {
	internal: ReturnType<typeof createInternalConfig>
	query: string
	results: PowerSearchItem[]
	editing: { filter: PartialFilter; index: number } | null
	/** Effective visibility, suppressed during editing or when disabled. */
	suggestionsOpen: boolean
	onQueryChange(value: string): void
	onInputFocus(): void
	onDismiss(): void
	onCancel(): void
	onEdit(filter: PowerSearchFilter, index: number): void
	onChoose(item: PowerSearchItem): void
	onRemove(index: number): void
	onClear(): void
	onSave(filter: PowerSearchFilter | null): void
}
