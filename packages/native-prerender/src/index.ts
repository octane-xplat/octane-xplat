export {
  ARTIFACT_LIMITS,
  PLACEHOLDER_HOSTS,
  STYLE_KEYS,
  SYSTEM_APPEARANCE_INPUT,
  SYSTEM_APPEARANCE_VALUES,
  ArtifactError,
  artifactNodeCount,
  isPlaceholderKind,
  validateArtifact,
  validateNodes,
} from './schema.ts'
export type {
  Literal,
  LiteralObject,
  LogicalNode,
  HostKind,
  PlaceholderKind,
  PlaceholderPropType,
  StyleRecord,
  LaunchConstraint,
  LaunchInput,
  StartupTree,
  StartupVariants,
  StartupArtifact,
  SystemAppearance,
} from './schema.ts'
export { projectPreparedTree, projectVisualTree, matchPreparedTree } from './project.ts'
export type { PreparedProjection, VisualNode, PreparedMatch } from './project.ts'
export { checkLaunchEnvironment, selectLaunchTree } from './environment.ts'
export type {
  LaunchEnvironment,
  LaunchCompatibility,
  SelectedLaunchTree,
} from './environment.ts'
export { createNativeClaims } from './adoption.ts'
export type { NativeClaims, NativeClaimPhase } from './adoption.ts'
export { prepareFirstFrame } from './first-frame.ts'
