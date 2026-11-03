// Authored routes retained with explicit, approved toolchain blockers.
export const authoredPageBlockers: Record<string, string> = {
  '/pages/theme-family/':
    'Pinned page renders generated theme-family stylesheets (themes/theme-family/sandbox-ocean-family.js) produced by the upstream theme compiler; no public Octane equivalent emits multi-member family CSS.',
  '/pages/layout-dsl/':
    'Pinned page requires @astryxdesign/cli/xle and generated xle-registry.json. No public Octane compiler equivalent is authorized.',
  '/pages/doc-preview/':
    'Pinned page requires the private DocPreview authoring renderer and generated foundationDocs.json, absent from the pinned source checkout.',
}
