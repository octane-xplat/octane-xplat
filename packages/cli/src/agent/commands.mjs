// Agent command surface — one descriptor per command drives parsing,
// `--schema`, `catalog`, and `--help`, so the machine-readable contract can
// never drift from the implementation. Item 2+ adds session/job/observation
// commands to this table; the `planned` list keeps the gap visible.
import { PERMISSION_SCOPES } from '../mcp/contracts/policy.mjs'
import { PLATFORMS } from '../mcp/contracts/identity.mjs'

const json = { flag: 'json', type: 'boolean', desc: 'Emit one contract JSON envelope on stdout' }
const schema = {
	flag: 'schema',
	type: 'boolean',
	desc: 'Print this command’s machine-readable schema and exit without running it',
}

const project = {
	flag: 'project',
	type: 'string',
	desc: 'Workspace root or app directory (default: current directory)',
}

const app = {
	flag: 'app',
	type: 'string',
	desc: 'Bind an app by id, workspace-relative path, or package name',
}

const client = {
	flag: 'client',
	type: 'string',
	desc: 'Selection-preference client scope (default: XPLAT_AGENT_CLIENT or "default")',
}

const platform = {
	flag: 'platform',
	type: 'enum',
	values: PLATFORMS,
	desc: 'Limit to one platform',
}

const contextFlags = [project, app, client, json, schema]

/** Selection required before the service runs: 'app' = a bound app. */
export const AGENT_COMMANDS = [
	{
		name: 'catalog',
		path: ['catalog'],
		mcpTool: null,
		summary: 'Machine-readable catalog of every command, its effects, permissions, and output kind',
		effect: 'read',
		permissions: [],
		context: 'none',
		positionals: [],
		flags: [json, schema],
		output: { kind: 'json', description: 'Command catalog with envelope, exit, and selection contracts' },
		errors: [],
		examples: ['xplat catalog --json'],
	},
	{
		name: 'status',
		path: ['status'],
		mcpTool: 'xplat_project_status',
		summary:
			'Project identity, installed framework versions, docs/code bindings, prerequisites, capabilities, permissions, and next steps',
		effect: 'read',
		permissions: [],
		context: 'workspace',
		positionals: [],
		flags: [
			{
				flag: 'refresh',
				type: 'boolean',
				desc: 'Re-scan the workspace (implicit for the CLI — every invocation discovers fresh)',
			},
			...contextFlags,
		],
		output: {
			kind: 'json',
			description:
				'Project status report; selection.state is bound | ambiguous | none — discovering a platform is not toolchain readiness',
		},
		errors: [{ code: 'execution_failure', exit: 5, when: 'Discovery itself failed' }],
		examples: ['xplat status --project /work/catalog-app --json'],
	},
	{
		name: 'app select',
		path: ['app', 'select'],
		mcpTool: 'xplat_select_app',
		summary:
			'Bind an explicit app for this client/workspace preference — never a global default; ambiguous matches fail with candidates',
		effect: 'mutate-preference',
		permissions: [],
		context: 'workspace',
		positionals: [
			{ name: 'selector', type: 'string', required: true, desc: 'App id, relative path, or package name' },
		],
		flags: [project, client, json, schema],
		output: { kind: 'json', description: 'The bound app and where the preference was persisted' },
		errors: [
			{ code: 'invalid_selection', exit: 2, when: 'No app matches the selector' },
			{ code: 'ambiguous_selection', exit: 2, when: 'The selector matches several apps' },
		],
		examples: ['xplat app select catalog-app --project /work --json'],
	},
	{
		name: 'capabilities',
		path: ['capabilities'],
		mcpTool: 'xplat_capability_matrix',
		summary:
			'Per-platform capability matrix: build, launch, inspection, actions, interaction, and capture are separate rows with honest status',
		effect: 'read',
		permissions: [],
		context: 'workspace',
		positionals: [],
		flags: [platform, ...contextFlags],
		output: {
			kind: 'json',
			description: 'Capability matrix; supported | partial | unavailable entries keep their qualification detail',
		},
		errors: [{ code: 'invalid_selection', exit: 2, when: 'Unknown platform' }],
		examples: ['xplat capabilities --project /work/catalog-app --platform web --json'],
	},
	{
		name: 'permissions',
		path: ['permissions'],
		mcpTool: 'xplat_permissions',
		summary: 'Report permission grants and their states — discovery never creates a grant',
		effect: 'read',
		permissions: [],
		context: 'workspace',
		positionals: [],
		flags: [
			{
				flag: 'scope',
				type: 'enum',
				values: PERMISSION_SCOPES,
				desc: 'Report one scope and whether it would pass a check right now',
			},
			...contextFlags,
		],
		output: { kind: 'json', description: 'All grants, or one scope plus its current check result' },
		errors: [],
		examples: ['xplat permissions --scope visual-capture --json'],
	},
	{
		name: 'targets',
		path: ['targets'],
		mcpTool: 'xplat_targets',
		summary:
			'Discover launchable targets for the bound app: exact target ids, availability, missing-toolchain reasons, and busy sessions — never starts a device',
		effect: 'read',
		permissions: [],
		context: 'app',
		positionals: [],
		flags: [platform, ...contextFlags],
		output: { kind: 'json', description: 'Declared platforms with discovered targets and reasons' },
		errors: [
			{ code: 'invalid_selection', exit: 2, when: 'No app is bound or the platform is undeclared' },
			{ code: 'ambiguous_selection', exit: 2, when: 'Several apps detected without a binding' },
		],
		examples: ['xplat targets --project /work/catalog-app --json'],
	},
	{
		name: 'docs search',
		path: ['docs', 'search'],
		mcpTool: 'xplat_docs_search',
		summary:
			'Search the bound app’s installed-version docs; results carry version/tag/commit provenance, and missing docs are explicit — never a latest fallback',
		effect: 'read',
		permissions: ['workspace'],
		context: 'app',
		positionals: [
			{ name: 'query', type: 'string', required: true, min: 1, max: 500, desc: 'Search text' },
		],
		flags: [
			{ flag: 'package', type: 'string', desc: 'Limit to one @octane-xplat package' },
			{
				flag: 'version',
				type: 'string',
				desc: 'Explicit comparison version — results stay labeled outside the installed binding',
			},
			platform,
			{
				flag: 'corpus',
				type: 'enum',
				values: ['guide', 'recipe', 'design-note', 'implementation-note'],
				default: 'guide',
				desc: 'Documentation corpus (default: guide)',
			},
			{ flag: 'limit', type: 'integer', min: 1, max: 50, desc: 'Maximum hits (default: 10)' },
			...contextFlags,
		],
		output: {
			kind: 'json',
			description: 'Hits with provenance, unavailable/conflict entries, and project guidance',
		},
		errors: [
			{ code: 'permission_denied', exit: 4, when: 'The workspace scope is not granted' },
			{ code: 'invalid_selection', exit: 2, when: 'No app is bound' },
			{ code: 'ambiguous_selection', exit: 2, when: 'Several apps detected without a binding' },
		],
		examples: [
			'xplat docs search "camera permission" --project /work/catalog-app --platform ios --json',
		],
	},
	{
		name: 'docs read',
		path: ['docs', 'read'],
		mcpTool: 'xplat_docs_read',
		summary: 'Read a bounded documentation page from a search ref, or package + path, at its bound version',
		effect: 'read',
		permissions: ['workspace'],
		context: 'app',
		positionals: [],
		flags: [
			{ flag: 'ref', type: 'string', desc: 'xplat-doc:// ref returned by docs search' },
			{ flag: 'package', type: 'string', desc: 'Package name (with --path)' },
			{ flag: 'path', type: 'string', desc: 'Doc path inside the package (with --package)' },
			{ flag: 'version', type: 'string', desc: 'Explicit comparison version' },
			{ flag: 'offset', type: 'integer', min: 0, desc: 'Continuation offset' },
			{ flag: 'limit', type: 'integer', min: 1, max: 20000, desc: 'Maximum characters' },
			...contextFlags,
		],
		output: { kind: 'json', description: 'Bounded page with provenance, or an explicit unavailable result' },
		errors: [
			{ code: 'permission_denied', exit: 4, when: 'The workspace scope is not granted' },
			{ code: 'invalid_selection', exit: 2, when: 'No app is bound or the ref is malformed' },
		],
		examples: ['xplat docs read --ref xplat-doc://@octane-xplat%2Fui@0.14.0/start/install.md --json'],
	},
	{
		name: 'guidance',
		path: ['guidance'],
		mcpTool: 'xplat_guidance',
		summary: 'Tailored guidance for the bound app’s actual installed package versions',
		effect: 'read',
		permissions: ['workspace'],
		context: 'app',
		positionals: [],
		flags: contextFlags,
		output: { kind: 'json', description: 'Provenance-labeled guidance entries' },
		errors: [
			{ code: 'permission_denied', exit: 4, when: 'The workspace scope is not granted' },
			{ code: 'invalid_selection', exit: 2, when: 'No app is bound' },
		],
		examples: ['xplat guidance --project /work/catalog-app --json'],
	},
	{
		name: 'code search',
		path: ['code', 'search'],
		mcpTool: 'xplat_code_search',
		summary:
			'Search current source: exact token search always works; an optional local index accelerates intent queries — results are leads with refs, open them with code read',
		effect: 'read',
		permissions: ['workspace'],
		context: 'workspace',
		positionals: [
			{ name: 'query', type: 'string', required: true, desc: 'Identifier, phrase, or intent' },
		],
		flags: [
			{
				flag: 'mode',
				type: 'enum',
				values: ['auto', 'exact', 'semantic'],
				default: 'auto',
				desc: 'exact = current files; semantic = local index; auto = both',
			},
			{
				flag: 'corpus',
				type: 'enum',
				values: ['app', 'framework', 'all'],
				default: 'all',
				desc: 'app = bound app, framework = its installed @octane-xplat packages',
			},
			platform,
			{ flag: 'package', type: 'string', desc: 'Limit the framework corpus to one package' },
			{ flag: 'limit', type: 'integer', min: 1, max: 50, desc: 'Maximum hits (default: 10)' },
			...contextFlags,
		],
		output: { kind: 'json', description: 'Labeled hits with refs, freshness, coverage, and index state' },
		errors: [
			{ code: 'permission_denied', exit: 4, when: 'The workspace scope is not granted' },
			{ code: 'invalid_selection', exit: 2, when: 'No bound app in a consumer workspace' },
			{ code: 'ambiguous_selection', exit: 2, when: 'Several apps detected without a binding' },
		],
		examples: ['xplat code search "CameraView" --project /work/catalog-app --mode exact --json'],
	},
	{
		name: 'code read',
		path: ['code', 'read'],
		mcpTool: 'xplat_code_read',
		summary:
			'Read current source by a search ref or explicit corpus + path; a file that changed or vanished is reported, never served stale',
		effect: 'read',
		permissions: ['workspace'],
		context: 'workspace',
		positionals: [],
		flags: [
			{ flag: 'ref', type: 'string', desc: 'xplat-code://<corpus>/<key> from a search hit' },
			{ flag: 'corpus', type: 'enum', values: ['app', 'framework'], desc: 'Corpus for --path' },
			{ flag: 'package', type: 'string', desc: 'Framework package for --path' },
			{ flag: 'path', type: 'string', desc: 'Workspace-relative or package-relative path' },
			{ flag: 'offset', type: 'integer', min: 0, desc: 'Continuation offset' },
			{ flag: 'limit', type: 'integer', min: 1, max: 64000, desc: 'Maximum characters' },
			...contextFlags,
		],
		output: { kind: 'json', description: 'Bounded source slice with freshness and provenance' },
		errors: [
			{ code: 'permission_denied', exit: 4, when: 'The workspace scope is not granted' },
			{ code: 'invalid_selection', exit: 2, when: 'Missing ref/path or no bound app' },
		],
		examples: ['xplat code read --ref xplat-code://app/src/main.tsrx --json'],
	},
]

/** Formerly MCP-only operations — surfaced here once their journey lands. */
export const PLANNED_COMMANDS = [
	{ name: 'runtime build', mcpTool: 'xplat_build', status: 'planned' },
	{ name: 'session start', mcpTool: 'xplat_launch', status: 'planned' },
	{ name: 'session attach', mcpTool: 'xplat_attach', status: 'planned' },
	{ name: 'session list', mcpTool: 'xplat_sessions', status: 'planned' },
	{ name: 'session status', mcpTool: 'xplat_sessions', status: 'planned' },
	{ name: 'session end', mcpTool: 'xplat_session_end', status: 'planned' },
	{ name: 'job status', mcpTool: 'xplat_job_status', status: 'planned' },
	{ name: 'job cancel', mcpTool: 'xplat_job_cancel', status: 'planned' },
	{ name: 'logs', mcpTool: 'xplat_logs', status: 'planned' },
	{ name: 'inspect', mcpTool: 'xplat_inspect', status: 'planned' },
	{ name: 'interact', mcpTool: 'xplat_interact', status: 'planned' },
	{ name: 'capture', mcpTool: 'xplat_screenshot', status: 'planned' },
	{ name: 'query', mcpTool: null, status: 'planned' },
	{ name: 'evidence list', mcpTool: 'xplat_evidence', status: 'planned' },
	{ name: 'evidence retain', mcpTool: 'xplat_evidence', status: 'planned' },
	{ name: 'evidence delete', mcpTool: 'xplat_evidence', status: 'planned' },
	{ name: 'actions list', mcpTool: 'xplat_dev_actions', status: 'planned' },
	{ name: 'actions invoke', mcpTool: 'xplat_dev_action_invoke', status: 'planned' },
	{ name: 'actions status', mcpTool: 'xplat_dev_action_status', status: 'planned' },
]

/** Existing orchestration commands — unchanged, human-oriented. */
export const LEGACY_COMMANDS = [
	{ name: 'dev', effect: 'orchestrate', output: 'human', summary: 'Run dev servers for the app’s targets' },
	{ name: 'build', effect: 'orchestrate', output: 'human', summary: 'Production builds (not the agent job contract — see planned `runtime build`)' },
	{ name: 'typecheck', effect: 'orchestrate', output: 'human', summary: 'Type-check the app’s platform tsconfigs' },
	{ name: 'doctor', effect: 'read', output: 'human', summary: 'Environment + framework patch diagnostics' },
	{ name: 'clean', effect: 'mutate-workspace', output: 'human', summary: 'Remove build outputs' },
	{ name: 'routes', effect: 'mutate-workspace', output: 'human', summary: 'Generate route manifests' },
	{ name: 'add', effect: 'mutate-workspace', output: 'human', summary: 'Enable another platform target' },
	{ name: 'patches', effect: 'mutate-workspace', output: 'human', summary: 'Apply/check the framework pnpm patch set' },
	{ name: 'fonts', effect: 'mutate-workspace', output: 'human', summary: 'Install font files' },
	{ name: 'updates', effect: 'mutate-workspace', output: 'human', summary: 'Configure OTA updates' },
	{ name: 'workshop', effect: 'orchestrate', output: 'human', summary: 'Component workshop commands' },
]

export const findCommand = (path) =>
	AGENT_COMMANDS.find((command) => command.path.join(' ') === path.join(' '))

export const commandPaths = () => AGENT_COMMANDS.map((command) => command.path)
