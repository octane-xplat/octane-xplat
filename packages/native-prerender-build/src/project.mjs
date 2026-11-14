import { projectPreparedTree, projectVisualTree } from '@octane-xplat/native-prerender'

// Diagnostics and fixed native lowerers use a visual projection. The XPI1
// artifact separately retains every logical text slot.
export function projectStartup(commands) {
  return projectVisualTree(projectPreparedTree(commands).nodes).map(
    ({ logicalNode, ...node }) => node,
  )
}
