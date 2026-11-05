// The Go migration deliberately replaces agent-owned launch/build sessions.
// Curate this at build time; keep the retained TypeScript CLI unchanged.
export function goDevContracts(source) {
	const metadata = JSON.parse(JSON.stringify(source))
	const removed = new Set([
		'runtime build',
		'job status',
		'job cancel',
		'session start',
		'session end',
	])
	const summaries = {
		targets: 'List targets and app connections registered with the running dev server',
		'session attach': 'Attach an observer to an app already connected to xplat dev',
		'session list': 'List app instances connected to the running dev server',
		'session status': 'Read an existing app instance without starting or ending it',
	}
	metadata.descriptors = metadata.descriptors
		.filter(({ name }) => !removed.has(name))
		.map((descriptor) => {
			const name = descriptor.name
			if (!summaries[name]) {
				return descriptor
			}
			return {
				...descriptor,
				name,
				path: name.split(' '),
				context: 'app',
				effect: 'observe',
				summary: summaries[name],
				permissions: [],
			}
		})
	const schema = (original) => {
		const name = original.command
		if (!summaries[name]) {
			return original
		}
		return {
			...original,
			command: name,
			summary: summaries[name],
			effect: 'observe',
			permissions: [],
			requiresBoundApp: true,
			...(name === 'session attach'
				? {
						input: attachSchema.input,
						errors: attachSchema.errors,
						examples: attachSchema.examples,
					}
				: {}),
		}
	}
	const attach = metadata.descriptors.find(({ name }) => name === 'session attach')
	attach.flags = attach.flags.map((flag) =>
		flag.flag === 'platform'
			? { ...flag, desc: 'Platform to observe; optional when one app matches' }
			: flag,
	)
	attach.flags.push({
		flag: 'instance',
		key: 'appInstanceId',
		type: 'string',
		desc: 'Exact connected app instance when a target has several apps',
	})
	attach.examples = ['xplat session attach --platform web --instance APP_INSTANCE --json']
	const attachSchema = metadata.schemas['session attach']
	attachSchema.input.flags = attachSchema.input.flags.map((flag) =>
		flag.flag === '--platform'
			? { ...flag, description: 'Platform to observe; optional when one app matches' }
			: flag,
	)
	attachSchema.input.flags.push({
		flag: '--instance',
		type: 'string',
		description: 'Exact connected app instance when a target has several apps',
	})
	attachSchema.errors = attachSchema.errors.filter(({ code }) => code !== 'permission_denied')
	attachSchema.examples = attach.examples
	for (const descriptor of metadata.descriptors) {
		if (descriptor.name === 'actions invoke') {
			descriptor.summary = descriptor.summary.replace(
				'`xplat job status`',
				'`xplat actions status`',
			)
		}
	}
	for (const schema of [
		metadata.schemas['actions invoke'],
		...metadata.catalog.commands.filter((item) => item.command === 'actions invoke'),
	]) {
		schema.summary = schema.summary.replace('`xplat job status`', '`xplat actions status`')
	}
	for (const descriptor of metadata.descriptors) {
		if (descriptor.name === 'actions status') {
			descriptor.context = 'app'
		}
	}
	metadata.schemas['actions status'].requiresBoundApp = true
	for (const command of metadata.catalog.commands) {
		if (command.command === 'actions status') {
			command.requiresBoundApp = true
		}
	}
	// Go has foreground captures, not the superseded detached build-job API.
	const diagnostics = metadata.descriptors.find(({ name }) => name === 'diagnostics')
	diagnostics.context = 'app'
	diagnostics.summary =
		'List foreground engine captures or read bounded logs and scoped native reports; app sessions use separate IDs'
	diagnostics.flags = diagnostics.flags.filter(({ flag }) => flag !== 'job')
	diagnostics.flags.find(({ flag }) => flag === 'session').desc =
		'Engine capture ID returned by diagnostics; distinct from observed app sessions'
	for (const item of [
		metadata.schemas.diagnostics,
		...metadata.catalog.commands.filter(({ command }) => command === 'diagnostics'),
	]) {
		item.requiresBoundApp = true
		item.summary = diagnostics.summary
		item.input.flags = item.input.flags.filter(({ flag }) => flag !== '--job')
		item.input.flags.find(({ flag }) => flag === '--session').description = diagnostics.flags.find(
			({ flag }) => flag === 'session',
		).desc

		item.output.description =
			'Engine capture sessions, or {session, logs, reports, coverage}. Apple report discovery is host/identity scoped; --report reads a retained original. Browser coverage reports observations in the returned page.'

		item.errors = item.errors.map((error) => ({
			...error,
			when: error.when.replace('run, session or job capture', 'engine capture session'),
		}))
	}

	// Browser inspection attaches through the app socket; it never owns Chromium.
	for (const name of ['inspect', 'evidence list', 'evidence delete']) {
		const descriptor = metadata.descriptors.find((item) => item.name === name)
		descriptor.context = 'app'
		if (name === 'inspect') {
			descriptor.summary =
				'Read bounded named DOM hosts from a connected browser app; private values are redacted and no input is sent'
		} else {
			descriptor.summary =
				name === 'evidence list'
					? 'List bounded inspection records from the current selected app dev-server startup'
					: 'Delete a current dev-server inspection record; client transcripts remain outside server control'
		}

		for (const item of [
			metadata.schemas[name],
			...metadata.catalog.commands.filter((item) => item.command === name),
		]) {
			item.requiresBoundApp = true
			item.summary = descriptor.summary
			if (name === 'inspect') {
				item.errors = item.errors.map((error) =>
					error.code === 'unsupported_capability'
						? { ...error, when: 'The connected app has no named-host browser inspector' }
						: error,
				)
			}
		}
	}
	const interact = metadata.descriptors.find(({ name }) => name === 'interact')
	interact.summary =
		'Dispatch an explicit programmatic HTML click in a connected app; requires inspected document and startup-scoped request key, never CDP or OS input'
	interact.flags = interact.flags.filter(({ flag }) => flag !== 'key')
	Object.assign(
		interact.flags.find(({ flag }) => flag === 'mechanism'),
		{
			values: ['handler-dispatch'],
			desc: 'Explicit programmatic HTMLElement.click; not CDP or OS input (required)',
		},
	)
	interact.flags.push({
		flag: 'request-key',
		key: 'requestKey',
		type: 'string',
		desc: 'Required startup-scoped key; reuse identical input to read the same receipt without dispatching again',
	})
	interact.examples = [
		'xplat interact APP_SESSION_ID --document DOCUMENT_ID --testid counter.increment --mechanism handler-dispatch --request-key CLICK_KEY --json',
	]
	for (const item of [
		metadata.schemas.interact,
		...metadata.catalog.commands.filter(({ command }) => command === 'interact'),
	]) {
		item.summary = interact.summary
		item.examples = interact.examples
		item.input.flags = item.input.flags.filter(({ flag }) => flag !== '--key')
		Object.assign(
			item.input.flags.find(({ flag }) => flag === '--mechanism'),
			{
				values: ['handler-dispatch'],
				description: 'Explicit programmatic HTMLElement.click; not CDP or OS input (required)',
			},
		)

		item.input.flags.push({
			flag: '--request-key',
			type: 'string',
			description: interact.flags.at(-1).desc,
		})

		item.output.description =
			'Confirmed programmatic dispatch with an evidence reference, or a failure preserving not-run/unknown effects. Reusing the same request key never dispatches again in this startup.'

		item.errors = item.errors.filter(({ code }) => code !== 'prerequisite_missing')
		item.errors.push(
			{
				code: 'disconnected_runtime',
				exit: 6,
				when: 'App delivery was lost; effects may remain unknown',
			},
			{
				code: 'execution_failure',
				exit: 3,
				when: 'App confirmation was invalid; effects remain unknown',
			},
			{
				code: 'target_busy',
				exit: 3,
				when: 'Another operation holds the app slot; this attempt did not run',
			},
		)
	}

	metadata.schemas = Object.fromEntries(
		Object.entries(metadata.schemas)
			.filter(([name]) => !removed.has(name))
			.map(([name, value]) => [name, schema(value)]),
	)
	metadata.catalog.commands = metadata.catalog.commands
		.filter(({ command }) => !removed.has(command))
		.map(schema)
	metadata.capabilityIds = metadata.capabilityIds.filter(
		(name) => !['launch', 'job_control', 'session_end'].includes(name),
	)
	const devSummary = 'Explicitly start the app dev server and selected development engines'
	for (const command of metadata.orchestrationDescriptors) {
		if (command.name !== 'dev') {
			continue
		}

		command.summary = devSummary
		command.flags.push(
			{
				flag: 'project',
				type: 'string',
				desc: 'Workspace or app directory; defaults to the nearest package from cwd',
			},
			{
				flag: 'app',
				type: 'string',
				desc: 'Explicit app id, path or name; required when workspace selection is ambiguous',
			},
			{
				flag: 'client',
				type: 'string',
				desc: 'Saved app-selection preference namespace; not an authentication identity',
			},
		)
	}
	for (const command of metadata.catalog.orchestration) {
		if (command.name === 'dev') {
			command.summary = devSummary
		}
	}
	metadata.boundaries = metadata.boundaries.filter((value) => !value.includes('launch permission'))
	metadata.boundaries.push(
		'App-control commands attach to an explicitly started xplat dev server. They do not start servers, launch applications, install apps, or terminate human-owned processes.',
	)
	return metadata
}
