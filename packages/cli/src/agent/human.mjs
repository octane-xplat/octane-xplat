// Human-readable renderers — the default when --json is absent. Compact on
// purpose: the machine contract carries the detail.
const lines = (out, text) => out.push(text)

const prov = (p) =>
	p
		? ` [${p.servedVersion ?? p.source}${p.match ? `, ${p.match}` : ''}${p.offline ? ', offline' : ''}]`
		: ''

export function renderHuman(command, result, out = []) {
	const { name } = command
	const data = result.data

	switch (name) {
		case 'catalog':
			for (const cmd of data.commands) {
				lines(out, `  xplat ${cmd.command.padEnd(18)} ${cmd.summary}`)
			}

			lines(out, '')
			lines(out, 'Orchestration (human-oriented):')
			for (const cmd of data.orchestration) {
				lines(out, `  xplat ${cmd.name.padEnd(18)} ${cmd.summary}`)
			}

			lines(out, '')
			lines(
				out,
				`Planned next (persistent sessions): ${data.planned.map((p) => p.name).join(', ')}`,
			)

			break

		case 'status': {
			const s = data
			lines(out, `Workspace: ${s.identity.workspace.root} (${s.identity.workspace.kind})`)
			lines(out, `Server: ${s.server.name}@${s.server.version}`)
			const sel = s.identity.selection
			if (sel.state === 'bound') {
				lines(out, `App: ${sel.app.id} (${sel.app.name}) — ${sel.reason}`)
			} else if (sel.state === 'ambiguous') {
				lines(out, `App: ambiguous — candidates: ${sel.candidates.map((a) => a.id).join(', ')}`)
			} else {
				lines(out, `App: none detected (${sel.reason})`)
			}

			for (const pkg of s.identity.framework?.packages ?? []) {
				lines(out, `  ${pkg.name}@${pkg.version ?? '?'} (${pkg.source})`)
			}

			lines(out, `Docs: ${s.docs.state} — ${s.docs.detail}`)
			lines(out, `Code: ${s.codeIndex.state} — ${s.codeIndex.detail}`)
			const missing = s.prerequisites.filter((p) => p.status === 'missing')
			for (const p of missing) {
				lines(out, `Missing: ${p.name} — ${p.remedy}`)
			}

			for (const step of s.nextSteps) {
				lines(out, `Next: ${step}`)
			}

			break
		}

		case 'app select':
			lines(
				out,
				`Bound ${data.bound.id} (${data.bound.name}) — preference saved for client "${data.preference.client}"`,
			)

			break

		case 'capabilities':
			for (const matrix of data.capabilities) {
				lines(out, `${matrix.platform}${matrix.declared ? '' : ' (not declared)'}:`)
				for (const cap of matrix.capabilities) {
					lines(out, `  ${cap.capability}: ${cap.status}${cap.detail ? ` — ${cap.detail}` : ''}`)
				}
			}

			break

		case 'permissions':
			for (const g of data.grants ?? [data.grant]) {
				lines(out, `${g.scope}: ${g.state}${g.note ? ` — ${g.note}` : ''}`)
			}

			if (data.check && !data.check.granted) {
				lines(out, `Check: ${data.check.error.message}`)
			}

			break

		case 'targets':
			for (const platform of data.platforms) {
				lines(out, `${platform.platform}${platform.declared ? '' : ' (not declared)'}:`)
				if (platform.reason) {
					lines(out, `  ${platform.reason}`)
				}

				for (const t of platform.targets) {
					lines(out, `  ${t.targetId} — ${t.name}${t.busy ? ' (busy)' : ''}`)
				}
			}

			break

		case 'docs search':
			for (const hit of data.results ?? []) {
				lines(out, `${hit.title} — ${hit.path}${prov(hit.provenance)}`)
				lines(out, `  ref: ${hit.ref}`)
			}

			for (const u of data.unavailable ?? []) {
				lines(out, `unavailable: ${u.provenance?.package ?? u.package} — ${u.reason}`)
			}

			if (!(data.results ?? []).length) {
				lines(out, 'No hits.')
			}

			break

		case 'docs read':
			if (data.status) {
				lines(out, `${data.status}: ${data.reason ?? ''}`)
				break
			}

			lines(out, `${data.ref ?? ''}${prov(data.provenance)}`)
			lines(out, data.content ?? '')
			break

		case 'guidance':
			for (const entry of data.entries ?? []) {
				lines(out, `${entry.title ?? entry.path}: ${entry.summary ?? entry.excerpt ?? ''}`)
			}

			break

		case 'code search':
			for (const hit of data.results ?? []) {
				lines(out, `${hit.corpus}:${hit.path}:${hit.line} — ${hit.excerpt.split('\n')[0].trim()}`)
				lines(out, `  ref: ${hit.ref}`)
			}

			if (!(data.results ?? []).length) {
				lines(out, 'No hits.')
			}

			break

		case 'code read':
			if (data.status) {
				lines(out, `${data.status}: ${data.reason ?? data.detail ?? ''}`)
				break
			}

			lines(out, `${data.path} (${data.corpus})`)
			lines(out, data.content ?? '')
			break

		case 'runtime build':
		case 'actions invoke': {
			const dedup = data.deduplicated ? ' (deduplicated: the live job was returned)' : ''
			lines(out, `${data.job.kind} job ${data.job.jobId} — ${data.job.state}${dedup}`)
			lines(out, `Poll: xplat job status ${data.job.jobId}`)
			break
		}

		case 'session start':
			lines(
				out,
				`session ${data.session.sessionId} — ${data.session.platform} on ${data.session.targetId} (${data.session.ownership}, ${data.session.state})`,
			)

			lines(
				out,
				`launch job ${data.job.jobId} — ${data.job.state}; poll: xplat job status ${data.job.jobId}`,
			)

			break

		case 'session attach':
			lines(
				out,
				`session ${data.session.sessionId} — attached ${data.session.platform} on ${data.session.targetId}${data.detail ? ` (${data.detail})` : ''}`,
			)

			break

		case 'session list':
			if (data.host?.state === 'absent') {
				lines(out, 'No agent runtime host is running — no sessions exist.')
			}

			for (const session of data.sessions) {
				lines(
					out,
					`${session.sessionId} — ${session.platform} on ${session.targetId} (${session.ownership}, ${session.state})`,
				)
			}

			if (!data.sessions.length && data.host?.state !== 'absent') {
				lines(out, 'No sessions bound.')
			}

			break

		case 'session status':
			lines(out, JSON.stringify(data.session, null, 2))
			break

		case 'session end': {
			const result = data.result
			lines(out, `${result.sessionId}: ${result.ended ? 'ended' : 'not found'}`)
			for (const item of result.released ?? []) {
				lines(out, `  released: ${item}`)
			}

			for (const item of result.preserved ?? []) {
				lines(out, `  preserved: ${item}`)
			}

			break
		}

		case 'job status':
		case 'job cancel':
		case 'actions status':
			lines(out, JSON.stringify(data.job ?? data, null, 2))
			break

		case 'logs':
			for (const record of data.records ?? []) {
				lines(out, `[${record.stream}] ${record.line}`)
			}

			if (!data.records?.length) {
				lines(out, data.note ?? 'No records.')
			}

			if (data.truncated) {
				lines(out, `(truncated — ${data.dropped} records dropped before this page)`)
			}

			if (data.historical) {
				lines(out, '(historical — the session is stopped or disconnected)')
			}

			break

		case 'inspect':
			for (const control of data.controls ?? []) {
				lines(
					out,
					`${control.name ?? control.kind} — ${JSON.stringify(control.frame ?? {})}${control.text !== undefined ? ` "${control.text}"` : ''}`,
				)
			}

			if (!data.controls?.length) {
				lines(out, 'No controls in range.')
			}

			if (data.nextOffset !== undefined && data.nextOffset !== null) {
				lines(out, `(more — continue with --offset ${data.nextOffset})`)
			}

			break

		case 'interact':
			lines(
				out,
				`Input sent (${data.evidence?.provenance?.mechanism ?? 'unknown'}) — verify app state separately; delivery is not an assertion.`,
			)

			break

		case 'capture':
			lines(
				out,
				`Captured: ${data.evidence?.artifactPath ?? 'artifact recorded'} (${data.evidence?.id})`,
			)

			break

		case 'evidence list':
			if (data.host?.state === 'absent') {
				lines(out, 'No agent runtime host is running — no evidence exists.')
			}

			for (const record of data.evidence) {
				lines(out, `${record.id} — ${record.kind}: ${record.summary} (${record.retention.scope})`)
			}

			if (!data.evidence.length && data.host?.state !== 'absent') {
				lines(out, 'No evidence recorded.')
			}

			break

		case 'evidence retain':
			lines(
				out,
				`Retained ${data.record.id} (${data.record.retention.scope}${data.record.retention.expiresAt ? `, expires ${data.record.retention.expiresAt}` : ''})`,
			)

			break

		case 'evidence delete':
			lines(out, data.deleted ? 'Deleted.' : 'Nothing deleted.')
			break

		case 'actions list':
			lines(out, `${data.state}: ${data.detail}`)
			for (const instance of data.instances ?? []) {
				lines(
					out,
					`${instance.appInstanceId} — ${instance.platform} rev ${instance.revision} (${instance.state})`,
				)

				for (const action of instance.actions) {
					lines(
						out,
						`  ${action.id} — ${action.title}${action.liveAvailability?.ready === false ? ` (unavailable: ${action.liveAvailability.reason})` : ''}`,
					)
				}
			}

			break

		default:
			lines(out, JSON.stringify(data, null, 2))
	}

	return out.join('\n')
}

export function renderHumanError(command, error) {
	const hint = error.recovery?.action ? `\n  → ${error.recovery.action}` : ''
	return `xplat ${command.name}: ${error.code}: ${error.message}${hint}`
}
