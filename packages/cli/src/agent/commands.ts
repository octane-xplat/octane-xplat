// Agent command surface — one descriptor per command drives parsing,
// `--schema`, `catalog`, and `--help`, so the machine-readable contract can
// never drift from the implementation. Stateful commands (sessions, jobs,
// logs, observation, actions, evidence) route through the per-workspace
// agent runtime host in host.mjs — see host-client.mjs.
import { EVIDENCE_KINDS } from '../mcp/contracts/evidence.ts'
import { PLATFORMS } from '../mcp/contracts/identity.ts'
import { PERMISSION_SCOPES } from '../mcp/contracts/policy.ts'

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
		summary:
			'Discover agent command contracts, other implemented commands, and planned commands for this CLI version',
		effect: 'read',
		permissions: [],
		context: 'none',
		positionals: [],
		flags: [json, schema],
		output: {
			kind: 'json',
			description: 'Command catalog with envelope, exit, and selection contracts',
		},
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
			{
				name: 'selector',
				type: 'string',
				required: true,
				desc: 'App id, relative path, or package name',
			},
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
			description:
				'Capability matrix; supported | partial | unavailable entries keep their qualification detail',
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
		summary:
			'Read a bounded documentation page from a search ref, or package + path, at its bound version',
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
		output: {
			kind: 'json',
			description: 'Bounded page with provenance, or an explicit unavailable result',
		},
		errors: [
			{ code: 'permission_denied', exit: 4, when: 'The workspace scope is not granted' },
			{ code: 'invalid_selection', exit: 2, when: 'No app is bound or the ref is malformed' },
		],
		examples: [
			'xplat docs read --ref xplat-doc://@octane-xplat%2Fui@0.14.0/start/install.md --json',
		],
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
		output: {
			kind: 'json',
			description: 'Labeled hits with refs, freshness, coverage, and index state',
		},
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
	{
		name: 'runtime build',
		path: ['runtime', 'build'],
		mcpTool: 'xplat_build',
		summary:
			'Build the bound app for one platform as a host-owned job — poll `xplat job status`, read output with `xplat diagnostics`',
		effect: 'orchestrate',
		permissions: ['runtime-actions'],
		context: 'app',
		positionals: [],
		flags: [
			{ ...platform, desc: 'Platform to build (required)' },
			{
				flag: 'request-key',
				key: 'requestKey',
				type: 'string',
				desc: 'Idempotence key — a retry returns the live job',
			},
			...contextFlags,
		],
		output: {
			kind: 'json',
			description: 'The accepted job record and whether it deduplicated a live one',
		},
		errors: [
			{ code: 'invalid_selection', exit: 2, when: 'Missing/unknown platform or undeclared target' },
			{ code: 'permission_denied', exit: 4, when: 'runtime-actions is not granted' },
		],
		examples: ['xplat runtime build --platform web --json'],
	},
	{
		name: 'session start',
		path: ['session', 'start'],
		mcpTool: 'xplat_launch',
		summary:
			'Start an owned development session: bind one app to one target; the launch job completes at readiness and the host keeps it alive',
		effect: 'orchestrate',
		permissions: ['runtime-actions'],
		context: 'app',
		positionals: [],
		flags: [
			{ ...platform, desc: 'Platform to launch (required)' },
			{
				flag: 'target',
				key: 'targetId',
				type: 'string',
				desc: 'Target id from `xplat targets` — required when several are available',
			},
			{
				flag: 'request-key',
				key: 'requestKey',
				type: 'string',
				desc: 'Idempotence key — a retry returns the live job',
			},
			{
				flag: 'browser-mode',
				key: 'browserMode',
				type: 'enum',
				values: ['headless', 'headed'],
				desc: 'Web only. Headed enables scoped OS keyboard input on qualified hosts',
			},
			...contextFlags,
		],
		output: {
			kind: 'json',
			description: 'The bound session and its launch job — poll `xplat job status` for readiness',
		},
		errors: [
			{ code: 'invalid_selection', exit: 2, when: 'Missing/unknown platform or target' },
			{ code: 'ambiguous_selection', exit: 2, when: 'Several targets available without --target' },
			{ code: 'target_busy', exit: 3, when: 'A live session already owns the target' },
			{ code: 'prerequisite_missing', exit: 3, when: 'No targets are available' },
			{ code: 'permission_denied', exit: 4, when: 'runtime-actions is not granted' },
		],
		examples: ['xplat session start --platform web --json'],
	},
	{
		name: 'session attach',
		path: ['session', 'attach'],
		mcpTool: 'xplat_attach',
		summary:
			'Bind a compatible dev session that is already running — never restarts or terminates it; attach preserves the user-owned session',
		effect: 'orchestrate',
		permissions: ['runtime-actions'],
		context: 'app',
		positionals: [],
		flags: [
			{ ...platform, desc: 'Platform to attach (required)' },
			{
				flag: 'target',
				key: 'targetId',
				type: 'string',
				desc: 'Candidate target id — required when several are attachable',
			},
			...contextFlags,
		],
		output: { kind: 'json', description: 'The attached session record and its discovery detail' },
		errors: [
			{ code: 'invalid_selection', exit: 2, when: 'Missing/unknown platform or candidate' },
			{
				code: 'ambiguous_selection',
				exit: 2,
				when: 'Several attachable sessions without --target',
			},
			{ code: 'not_found', exit: 2, when: 'No running session qualifies' },
			{ code: 'unsupported_capability', exit: 3, when: 'The platform has no attach provider' },
			{ code: 'permission_denied', exit: 4, when: 'runtime-actions is not granted' },
		],
		examples: ['xplat session attach --platform web --target web:5173 --json'],
	},
	{
		name: 'session list',
		path: ['session', 'list'],
		mcpTool: 'xplat_sessions',
		summary:
			'List the host’s bound sessions — owned sessions it started and attached user-owned sessions, with live state',
		effect: 'read',
		permissions: [],
		context: 'workspace',
		positionals: [],
		flags: contextFlags,
		output: {
			kind: 'json',
			description: 'Session records; host.state reports whether a runtime host answered',
		},
		errors: [],
		examples: ['xplat session list --json'],
	},
	{
		name: 'session status',
		path: ['session', 'status'],
		mcpTool: 'xplat_sessions',
		summary: 'One session record by id — state, ownership, target, build identity',
		effect: 'read',
		permissions: [],
		context: 'workspace',
		positionals: [
			{ name: 'sessionId', type: 'string', required: true, desc: 'Session id (sess_…)' },
		],
		flags: contextFlags,
		output: { kind: 'json', description: 'The session record' },
		errors: [{ code: 'not_found', exit: 2, when: 'No such session in a live host' }],
		examples: ['xplat session status sess_abc123 --json'],
	},
	{
		name: 'session end',
		path: ['session', 'end'],
		mcpTool: 'xplat_session_end',
		summary:
			'End a session with ownership-safe cleanup: owned sessions release their resources; attached user-owned sessions are preserved',
		effect: 'orchestrate',
		permissions: ['runtime-actions'],
		context: 'workspace',
		positionals: [
			{ name: 'sessionId', type: 'string', required: true, desc: 'Session id (sess_…)' },
		],
		flags: contextFlags,
		output: {
			kind: 'json',
			description:
				'The end result — released resources or preserved-session note; ending is idempotent',
		},
		errors: [{ code: 'not_found', exit: 2, when: 'No such session' }],
		examples: ['xplat session end sess_abc123 --json'],
	},
	{
		name: 'job status',
		path: ['job', 'status'],
		mcpTool: 'xplat_job_status',
		summary: 'Bounded status query for a job a runtime or actions command started',
		effect: 'read',
		permissions: [],
		context: 'workspace',
		positionals: [{ name: 'jobId', type: 'string', required: true, desc: 'Job id (job_…)' }],
		flags: contextFlags,
		output: {
			kind: 'json',
			description: 'The job record: state, progress, terminal result or error',
		},
		errors: [{ code: 'not_found', exit: 2, when: 'No such job in a live host' }],
		examples: ['xplat job status job_abc123 --json'],
	},
	{
		name: 'job cancel',
		path: ['job', 'cancel'],
		mcpTool: 'xplat_job_cancel',
		summary:
			'Cooperatively cancel one job — signals only that job; never kills an unrelated app or another user’s process',
		effect: 'orchestrate',
		permissions: ['runtime-actions'],
		context: 'workspace',
		positionals: [{ name: 'jobId', type: 'string', required: true, desc: 'Job id (job_…)' }],
		flags: contextFlags,
		output: { kind: 'json', description: 'The job record after the cancel request' },
		errors: [{ code: 'not_found', exit: 2, when: 'No such job in a live host' }],
		examples: ['xplat job cancel job_abc123 --json'],
	},
	{
		name: 'diagnostics',
		path: ['diagnostics'],
		mcpTool: 'xplat_diagnostics',
		summary:
			'List retained dev runs, or read logs and native report summaries; use --report for a retained original',
		effect: 'read',
		permissions: [],
		context: 'workspace',
		positionals: [],
		flags: [
			{
				flag: 'run',
				key: 'runId',
				type: 'string',
				desc: 'Retained xplat dev run id; omit selectors to list runs',
			},
			{
				flag: 'report',
				key: 'reportId',
				type: 'string',
				desc: 'Read a retained original report; requires --run, excludes log paging/filter flags',
			},
			platform,
			{ flag: 'session', key: 'sessionId', type: 'string', desc: 'Session id to read (or --job)' },
			{
				flag: 'job',
				key: 'jobId',
				type: 'string',
				desc: 'Build/launch job id to read (or --session)',
			},
			{ flag: 'cursor', type: 'integer', min: 0, desc: 'Continue after this record seq' },
			{ flag: 'limit', type: 'integer', min: 1, max: 5000, desc: 'Maximum records (default: 500)' },
			{
				flag: 'stream',
				type: 'enum',
				values: ['stdout', 'stderr', 'lifecycle'],
				desc: 'Limit to one stream',
			},
			...contextFlags,
		],
		output: {
			kind: 'json',
			description:
				'Retained runs, or {logs, reports, coverage}; --report returns the complete retained report. Log cursors do not page reports.',
		},
		errors: [
			{
				code: 'invalid_selection',
				exit: 2,
				when: 'Conflicting selectors, invalid run/cursor, or no bound app for retained logs',
			},
			{
				code: 'ambiguous_selection',
				exit: 2,
				when: 'Retained logs need an explicit app selection',
			},
			{ code: 'not_found', exit: 2, when: 'No such run, session or job capture' },
		],
		examples: [
			'xplat diagnostics --platform ios --json',
			'xplat diagnostics --run RUN_ID --limit 50 --json',
			'xplat diagnostics --session sess_abc123 --limit 50 --json',
		],
	},
	{
		name: 'inspect',
		path: ['inspect'],
		mcpTool: 'xplat_inspect',
		summary:
			'Bounded named DOM hosts in an owned Chromium session — explicit id/testID selector, private values redacted, document/session/build identity included',
		effect: 'read',
		permissions: ['runtime-actions'],
		context: 'app',
		positionals: [
			{ name: 'sessionId', type: 'string', required: true, desc: 'Session id (sess_…)' },
		],
		flags: [
			{ flag: 'id', type: 'string', desc: 'Control id attribute to select' },
			{ flag: 'testid', key: 'testID', type: 'string', desc: 'data-testid value to select' },
			{ flag: 'offset', type: 'integer', min: 0, desc: 'Continuation offset' },
			{
				flag: 'limit',
				type: 'integer',
				min: 1,
				max: 100,
				desc: 'Maximum controls (default: bounded)',
			},
			...contextFlags,
		],
		output: {
			kind: 'json',
			description: 'Controls with frames/text/flags, documentId, coverage, and the evidence record',
		},
		errors: [
			{ code: 'invalid_selection', exit: 2, when: 'Both --id and --testid were passed' },
			{ code: 'not_found', exit: 2, when: 'No such session or no matching control' },
			{ code: 'unsupported_capability', exit: 3, when: 'Not an owned Chromium session' },
			{ code: 'stale_identity', exit: 5, when: 'The session stopped or its app differs' },
			{ code: 'permission_denied', exit: 4, when: 'runtime-actions is not granted' },
		],
		examples: ['xplat inspect sess_abc123 --testid counter.value --json'],
	},
	{
		name: 'interact',
		path: ['interact'],
		mcpTool: 'xplat_interact',
		summary:
			'Send scoped input to one stable control from an inspected document — dom-event is a CDP click; os-input sends Space/Enter on qualified macOS hosts',
		effect: 'orchestrate',
		permissions: ['runtime-actions'],
		context: 'app',
		positionals: [
			{ name: 'sessionId', type: 'string', required: true, desc: 'Session id (sess_…)' },
		],
		flags: [
			{
				flag: 'document',
				key: 'documentId',
				type: 'string',
				desc: 'documentId from `xplat inspect` (required) — stale ids are refused',
			},
			{ flag: 'id', type: 'string', desc: 'Control id attribute (or --testid)' },
			{ flag: 'testid', key: 'testID', type: 'string', desc: 'data-testid value (or --id)' },
			{
				flag: 'mechanism',
				type: 'enum',
				values: ['dom-event', 'os-input'],
				desc: 'Input mechanism (required); os-input needs a desktop-input reservation',
			},
			{
				flag: 'key',
				type: 'enum',
				values: ['Space', 'Enter'],
				default: 'Space',
				desc: 'Key for os-input (default: Space)',
			},
			...contextFlags,
		],
		output: {
			kind: 'json',
			description: 'Input delivery record with mechanism provenance — not an app-state assertion',
		},
		errors: [
			{ code: 'invalid_selection', exit: 2, when: 'Missing document/mechanism or a selector' },
			{ code: 'stale_identity', exit: 5, when: 'The document changed since inspection' },
			{ code: 'unavailable', exit: 3, when: 'Control hidden/disabled/private or obscured' },
			{ code: 'prerequisite_missing', exit: 3, when: 'os-input prerequisites are absent' },
			{ code: 'permission_denied', exit: 4, when: 'runtime-actions is not granted' },
		],
		examples: [
			'xplat interact sess_abc123 --document doc_1 --testid counter.increment --mechanism dom-event --json',
		],
	},
	{
		name: 'capture',
		path: ['capture'],
		mcpTool: 'xplat_screenshot',
		summary:
			'Capture the owned Chromium viewport — requires a current visual-capture grant (XPLAT_PERMISSIONS); returns a session-scoped artifact',
		effect: 'orchestrate',
		permissions: ['visual-capture'],
		context: 'app',
		positionals: [
			{ name: 'sessionId', type: 'string', required: true, desc: 'Session id (sess_…)' },
		],
		flags: contextFlags,
		output: { kind: 'json', description: 'The evidence record with artifact path and provenance' },
		errors: [
			{ code: 'permission_denied', exit: 4, when: 'visual-capture was not granted' },
			{ code: 'unsupported_capability', exit: 3, when: 'Not an owned Chromium session' },
			{ code: 'not_found', exit: 2, when: 'No such session' },
		],
		examples: ['XPLAT_PERMISSIONS=visual-capture xplat capture sess_abc123 --json'],
	},
	{
		name: 'evidence list',
		path: ['evidence', 'list'],
		mcpTool: 'xplat_evidence',
		summary: 'List evidence artifacts the host recorded — session-scoped unless retained',
		effect: 'read',
		permissions: [],
		context: 'workspace',
		positionals: [],
		flags: [
			{ flag: 'kind', type: 'enum', values: EVIDENCE_KINDS, desc: 'Filter to one evidence kind' },
			...contextFlags,
		],
		output: { kind: 'json', description: 'Evidence records with provenance and retention scope' },
		errors: [],
		examples: ['xplat evidence list --kind screenshot --json'],
	},
	{
		name: 'evidence retain',
		path: ['evidence', 'retain'],
		mcpTool: 'xplat_evidence',
		summary:
			'Retain an evidence artifact past session cleanup — an explicit expiration or manual deletion only',
		effect: 'orchestrate',
		permissions: [],
		context: 'workspace',
		positionals: [
			{ name: 'id', type: 'string', required: true, desc: 'Evidence record id (ev_…)' },
		],
		flags: [
			{
				flag: 'expires-at',
				key: 'expiresAt',
				type: 'string',
				desc: 'ISO expiration; omit for manual deletion only',
			},
			...contextFlags,
		],
		output: { kind: 'json', description: 'The retained record and the transcript limitation note' },
		errors: [
			{ code: 'not_found', exit: 2, when: 'No such evidence record' },
			{ code: 'invalid_selection', exit: 2, when: 'The expiration is not a valid timestamp' },
		],
		examples: ['xplat evidence retain ev_abc123 --json'],
	},
	{
		name: 'evidence delete',
		path: ['evidence', 'delete'],
		mcpTool: 'xplat_evidence',
		summary:
			'Delete an evidence artifact — cannot erase an external client transcript that already recorded it',
		effect: 'orchestrate',
		permissions: [],
		context: 'workspace',
		positionals: [
			{ name: 'id', type: 'string', required: true, desc: 'Evidence record id (ev_…)' },
		],
		flags: contextFlags,
		output: { kind: 'json', description: 'The deletion result and the transcript limitation note' },
		errors: [{ code: 'not_found', exit: 2, when: 'No such evidence record' }],
		examples: ['xplat evidence delete ev_abc123 --json'],
	},
	{
		name: 'actions list',
		path: ['actions', 'list'],
		mcpTool: 'xplat_dev_actions',
		summary:
			'List the bound app’s declared development actions — the live registry a running dev app announces; an empty registry is reported distinctly from a disconnected app',
		effect: 'read',
		permissions: [],
		context: 'app',
		positionals: [],
		flags: contextFlags,
		output: {
			kind: 'json',
			description:
				'Live instances with declared actions, availability, revision, and disconnected instances',
		},
		errors: [{ code: 'invalid_selection', exit: 2, when: 'No app is bound' }],
		examples: ['xplat actions list --json'],
	},
	{
		name: 'actions invoke',
		path: ['actions', 'invoke'],
		mcpTool: 'xplat_dev_action_invoke',
		summary:
			'Invoke an app-declared development action against a specific instance and registry revision — returns a job to poll with `xplat job status`',
		effect: 'orchestrate',
		permissions: ['runtime-actions'],
		context: 'app',
		positionals: [],
		flags: [
			{
				flag: 'action',
				key: 'actionId',
				type: 'string',
				desc: 'Stable action id from `xplat actions list` (required)',
			},
			{
				flag: 'instance',
				key: 'appInstanceId',
				type: 'string',
				desc: 'App instance id — required when several are live',
			},
			{ flag: 'input', type: 'string', desc: 'JSON object matching the declared input contract' },
			{
				flag: 'revision',
				key: 'registryRevision',
				type: 'integer',
				min: 0,
				desc: 'Registry revision from actions list — stale revisions are rejected',
			},
			{
				flag: 'request-key',
				key: 'requestKey',
				type: 'string',
				desc: 'Idempotence key — a retry returns the live job',
			},
			...contextFlags,
		],
		output: {
			kind: 'json',
			description:
				'The accepted job, request id, action identity, and the revision it validated against',
		},
		errors: [
			{ code: 'invalid_selection', exit: 2, when: 'Missing action id or invalid input' },
			{ code: 'stale_identity', exit: 5, when: 'The registry revision is stale' },
			{ code: 'target_busy', exit: 3, when: 'The invocation queue is saturated' },
			{
				code: 'unavailable',
				exit: 3,
				when: 'The action is unavailable or no live instance announced',
			},
			{
				code: 'permission_denied',
				exit: 4,
				when: 'runtime-actions (or external-effects for declared effects) is not granted',
			},
		],
		examples: ['xplat actions invoke --action fixture.describe-counter --json'],
	},
	{
		name: 'actions status',
		path: ['actions', 'status'],
		mcpTool: 'xplat_dev_action_status',
		summary:
			'Status of a development-action invocation — job state, structured result or failure, disclosed partial effects',
		effect: 'read',
		permissions: [],
		context: 'workspace',
		positionals: [
			{ name: 'jobId', type: 'string', required: true, desc: 'Dev-action job id (job_…)' },
		],
		flags: contextFlags,
		output: { kind: 'json', description: 'The job record plus invocation metadata' },
		errors: [
			{ code: 'not_found', exit: 2, when: 'No such job' },
			{ code: 'invalid_selection', exit: 2, when: 'The job is not a dev-action invocation' },
		],
		examples: ['xplat actions status job_abc123 --json'],
	},
]

/**
 * Declared but not yet implemented — kept visible so the catalog never
 * overstates coverage. `query` has no service contract on either transport;
 * it needs a design before it can join the implemented surface.
 */
export const PLANNED_COMMANDS = [{ name: 'query', mcpTool: null, status: 'planned' }]

/** Existing orchestration commands — unchanged, human-oriented. */
export const LEGACY_COMMANDS = [
	{
		name: 'upgrade',
		effect: 'mutate-workspace',
		output: 'human',
		summary: 'Inspect or apply the compatible framework version and managed patch set',
	},
	{
		name: 'fmt',
		effect: 'mutate-workspace',
		output: 'human',
		summary: 'Format source in place; --check reports differences without writing',
	},
	{
		name: 'lint',
		effect: 'mutate-workspace',
		output: 'human',
		summary: 'Check source correctness; --fix applies available fixes',
	},
	{
		name: 'dev',
		effect: 'orchestrate',
		output: 'human',
		summary: 'Run dev servers for the app’s targets',
	},
	{
		name: 'build',
		effect: 'orchestrate',
		output: 'human',
		summary:
			'Production builds (the interactive orchestrator — see `runtime build` for the agent job contract)',
	},
	{
		name: 'typecheck',
		effect: 'orchestrate',
		output: 'human',
		summary: 'Type-check the app’s platform tsconfigs',
	},
	{
		name: 'doctor',
		effect: 'read',
		output: 'human',
		summary: 'Environment + framework patch diagnostics',
	},
	{ name: 'clean', effect: 'mutate-workspace', output: 'human', summary: 'Remove build outputs' },
	{
		name: 'routes',
		effect: 'mutate-workspace',
		output: 'human',
		summary: 'Generate route manifests',
	},
	{
		name: 'add',
		effect: 'mutate-workspace',
		output: 'human',
		summary: 'Enable another platform target',
	},
	{
		name: 'patches',
		effect: 'mutate-workspace',
		output: 'human',
		summary: 'Apply/check the framework pnpm patch set',
	},
	{ name: 'fonts', effect: 'mutate-workspace', output: 'human', summary: 'Install font files' },
	{
		name: 'updates',
		effect: 'mutate-workspace',
		output: 'human',
		summary: 'Configure OTA updates',
	},
	{
		name: 'workshop',
		effect: 'orchestrate',
		output: 'human',
		summary: 'Component workshop commands',
	},
]

export const findCommand = (path) =>
	AGENT_COMMANDS.find((command) => command.path.join(' ') === path.join(' '))

export const commandPaths = () => AGENT_COMMANDS.map((command) => command.path)
