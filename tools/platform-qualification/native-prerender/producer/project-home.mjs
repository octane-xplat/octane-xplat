import { projectPreparedTree, projectVisualTree } from '@octane-xplat/native-prerender'

// The reusable projector owns validation. This fixture still emits the old XPH1
// visual shape for existing native qualification consumers during migration.
export function projectHome(commands) {
  return projectVisualTree(projectPreparedTree(commands).nodes).map(
    ({ logicalNode, ...node }) => node,
  )
}
