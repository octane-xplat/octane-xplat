/**
 * The project-status report — the single externally observable shape returned
 * by `xplat_project_status` at setup time. Later packages fill their own
 * slots through registered providers; absent providers read as
 * `not_provided`, never as healthy or silently absent.
 */

import type {
	CodeIndexStatus,
	DocsStatus,
	GuidanceStatus,
	ProjectIdentity,
	RuntimePrerequisite,
} from './identity'

import type { PlatformCapabilityMatrix } from './capabilities'
import type { PermissionGrant } from './policy'

export interface ServerInfo {
	name: string
	version: string
}

export interface ProjectStatusReport {
	server: ServerInfo
	identity: ProjectIdentity
	guidance: GuidanceStatus
	docs: DocsStatus
	codeIndex: CodeIndexStatus
	/** Prerequisites relevant to the detected apps' declared platforms. */
	prerequisites: RuntimePrerequisite[]
	/** Matrix for the workspace's declared platforms. */
	capabilities: PlatformCapabilityMatrix[]
	/** Current permission grants and their states. */
	permissions: PermissionGrant[]
	/** What this product deliberately does not do. */
	boundaries: readonly string[]
	/** Ordered next steps for the agent, tailored to the report's actual state. */
	nextSteps: string[]
}
