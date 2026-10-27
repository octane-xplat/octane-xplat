import { createContext } from 'octane'
import type { ProjectionNode } from './node'

/** Nearest ancestor projection node; hosts with `layout` provide their own. */
export const ProjectionContext = createContext<ProjectionNode | null>(null)
