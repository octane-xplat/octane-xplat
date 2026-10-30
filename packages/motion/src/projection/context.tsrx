import type { Context } from 'octane'
import { createContext } from 'octane'
import type { ProjectionNode } from './node'

/** Nearest ancestor projection node; hosts with `layout` provide their own. */
export const ProjectionContext: Context<ProjectionNode | null> =
	createContext<ProjectionNode | null>(null)
