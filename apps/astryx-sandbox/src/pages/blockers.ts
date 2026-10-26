// Authored routes retained with explicit, approved toolchain blockers.
export const authoredPageBlockers: Record<string, string> = {
	'/pages/layout-dsl/':
		'Pinned page requires @astryxdesign/cli/xle and generated xle-registry.json. No public Octane compiler equivalent is authorized.',
	'/pages/doc-preview/':
		'Pinned page requires the private DocPreview authoring renderer and generated foundationDocs.json, absent from the pinned source checkout.',
}
