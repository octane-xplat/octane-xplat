// Port of upstream templates/pages/form-wizard-inline/page.tsx (Astryx
// 0.6.4, MIT) — route /templates/form-wizard-inline/.
// GAPS: Step `indicator` accepts 'auto'/custom nodes — Spinner passes
// through; step `endContent` slot and nested-Stepper margin work as upstream.
import { useEffect, useMemo, useState } from 'octane'
import {
	Banner, Button, Card, CheckboxList, CheckboxListItem, FieldStatus,
	FormLayout, Heading, HStack, Icon, Layout, LayoutContent, LayoutHeader,
	MetadataList, MetadataListItem, RadioList, RadioListItem, Selector,
	Spinner, StackItem, Step, Stepper, Switch, Text, useToast, VStack,
} from '@octane-xplat/ui'

const REPOS = [
	{ id: 'web', name: 'northwind/web', branch: 'main', packageManager: 'pnpm 11', lockfile: 'pnpm-lock.yaml', testRunner: 'Vitest', testCount: 1284, description: 'Marketing site and the signed-in dashboard.' },
	{ id: 'api', name: 'northwind/api', branch: 'main', packageManager: 'npm 10', lockfile: 'package-lock.json', testRunner: 'Jest', testCount: 862, description: 'GraphQL gateway and the billing workers.' },
	{ id: 'design', name: 'northwind/design-system', branch: 'trunk', packageManager: 'pnpm 11', lockfile: 'pnpm-lock.yaml', testRunner: 'Vitest', testCount: 431, description: 'Component library published to the internal registry.' },
]

const TRIGGERS = [
	{ id: 'pr', label: 'Pull requests', description: 'Every push to a branch with an open pull request.' },
	{ id: 'push', label: 'Pushes to the default branch', description: 'Direct commits and merges, after the fact.' },
	{ id: 'tag', label: 'Release tags', description: 'Tags matching v*, so a release is verified before it ships.' },
]

const JOBS = [
	{ id: 'lint', label: 'Lint', description: 'ESLint and Prettier over the changed files. Needs 1 GB.', memoryGB: 1, seconds: 74 },
	{ id: 'unit', label: 'Unit tests', description: 'The full suite, sharded across the available cores. Needs 2 GB.', memoryGB: 2, seconds: 203 },
	{ id: 'build', label: 'Production build', description: 'The build that would ship, with bundle size reported. Needs 2 GB.', memoryGB: 2, seconds: 126 },
	{ id: 'e2e', label: 'End-to-end tests', description: 'Playwright against a preview deployment. Needs 4 GB.', memoryGB: 4, seconds: 391 },
]

const RUNNERS = [
	{ id: 'small', label: 'Small', memoryGB: 2, cores: 2, rate: '$0.008' },
	{ id: 'medium', label: 'Medium', memoryGB: 4, cores: 4, rate: '$0.016' },
	{ id: 'large', label: 'Large', memoryGB: 8, cores: 8, rate: '$0.032' },
]

const NODE_VERSIONS = [
	{ value: '22', label: 'Node 22 · Active LTS' },
	{ value: '20', label: 'Node 20 · Maintenance' },
	{ value: '24', label: 'Node 24 · Current' },
]

const STEP_META = [
	{ kind: 'human', label: 'Repository' },
	{ kind: 'human', label: 'Pipeline' },
	{ kind: 'auto', label: 'Connect' },
	{ kind: 'auto', label: 'Inspect the project' },
	{ kind: 'auto', label: 'Trial run' },
	{ kind: 'human', label: 'Review and enable' },
] as const

const AUTO_STEPS = [2, 3, 4]
const NESTED_RAIL_PULL = -28
const TICK_MS = 800
const SETTLE_MS = 560

type AutoStatus = 'idle' | 'passed' | 'failed'
type AutoState = { status: AutoStatus; done: number }

const IDLE: AutoState = { status: 'idle', done: 0 }
const INITIAL_AUTO: Record<number, AutoState> = { 2: IDLE, 3: IDLE, 4: IDLE }

export function FormWizardInlineTemplate() @{
	const showToast = useToast()

	const [active, setActive] = useState(0)
	const [auto, setAuto] = useState<Record<number, AutoState>>(INITIAL_AUTO)

	const [repoId, setRepoId] = useState('web')
	const [triggers, setTriggers] = useState<string[]>(['pr'])

	const [jobs, setJobs] = useState<string[]>(['lint', 'unit', 'build'])
	const [runnerId, setRunnerId] = useState('small')
	const [nodeVersion, setNodeVersion] = useState('22')

	const [strictBranches, setStrictBranches] = useState(true)

	const repo = REPOS.find((r) => r.id === repoId) ?? REPOS[0]
	const runner = RUNNERS.find((r) => r.id === runnerId) ?? RUNNERS[0]
	const selectedTriggers = TRIGGERS.filter((t) => triggers.includes(t.id))
	const isDone = active >= STEP_META.length

	const selectedJobs = useMemo(() => JOBS.filter((j) => jobs.includes(j.id)), [jobs])
	const starvedJob = selectedJobs.find((j) => j.memoryGB > runner.memoryGB)

	const triggerSummary =
		selectedTriggers.length === 0
			? 'nothing yet'
			: selectedTriggers
					.map((t) => t.label.toLowerCase())
					.join(' and ')
					.replace('pushes to the default branch', `pushes to ${repo.branch}`)

	const checksFor = useMemo<Record<number, { id: string; label: string }[]>>(
		() => ({
			2: [
				{ id: 'auth', label: 'Authenticating as the Northwind CI app' },
				{ id: 'perms', label: `Confirming write access to ${repo.name}` },
				{ id: 'hook', label: `Registering a webhook for ${triggerSummary}` },
			],
			3: [
				{ id: 'manifest', label: 'Reading package.json' },
				{ id: 'pm', label: 'Detecting the package manager' },
				{ id: 'runner', label: 'Locating the test runner' },
				{ id: 'cache', label: `Hashing ${repo.lockfile} for the cache key` },
			],
			4: [
				{ id: 'provision', label: `Provisioning the ${runner.label.toLowerCase()} runner` },
				{ id: 'install', label: 'Restoring the cache and installing' },
				...selectedJobs.map((job) => ({ id: job.id, label: `Running ${job.label.toLowerCase()}` })),
			],
		}),
		[repo.name, repo.lockfile, runner.label, selectedJobs, triggerSummary],
	)

	const errorsByStep = useMemo<Array<Record<string, string>>>(() => {
		const repository: Record<string, string> = {}
		if (triggers.length === 0) {
			repository.triggers = 'Pick at least one trigger.'
		}
		const pipeline: Record<string, string> = {}
		if (jobs.length === 0) {
			pipeline.jobs = 'Pick at least one job.'
		}
		return [repository, pipeline, {}, {}, {}, {}]
	}, [triggers, jobs])

	const currentErrors = isDone ? {} : errorsByStep[active] ?? {}
	const isStepBroken = (index: number) => index < active && Object.keys(errorsByStep[index] ?? {}).length > 0

	useEffect(() => {
		if (!AUTO_STEPS.includes(active)) {
			return undefined
		}
		const state = auto[active]
		if (state.status !== 'idle') {
			return undefined
		}

		const checks = checksFor[active]

		if (state.done >= checks.length) {
			const timer = setTimeout(() => {
				setAuto((s) => ({ ...s, [active]: { ...s[active], status: 'passed' } }))
				setActive((a) => a + 1)
			}, SETTLE_MS)
			return () => clearTimeout(timer)
		}

		const failingIndex =
			starvedJob == null ? -1 : checks.findIndex((check) => check.id === starvedJob.id)

		const timer = setTimeout(() => {
			setAuto((s) =>
				state.done === failingIndex
					? { ...s, [active]: { ...s[active], status: 'failed' } }
					: { ...s, [active]: { ...s[active], done: s[active].done + 1 } },
			)
		}, TICK_MS)
		return () => clearTimeout(timer)
	}, [active, auto, checksFor, starvedJob])

	const goToStep = (index: number) => {
		setActive(index)
		setAuto((s) => {
			const next = { ...s }
			for (const stepIndex of AUTO_STEPS) {
				if (stepIndex >= index) {
					next[stepIndex] = IDLE
				}
			}
			return next
		})
	}

	const confirmStep = () => {
		if (Object.keys(errorsByStep[active] ?? {}).length !== 0) {
			return
		}
		if (active === STEP_META.length - 1) {
			showToast({ body: 'Continuous integration is on', uniqueID: 'ci-enabled' })
		}
		setActive((a) => a + 1)
	}

	const hasFailure = AUTO_STEPS.some((stepIndex) => auto[stepIndex].status === 'failed')

	/** The status of a step, folding progress and the automatic result together. */
	const phaseOf = (index: number) => {
		if (STEP_META[index].kind === 'human') {
			return index < active ? 'passed' : 'pending'
		}
		if (auto[index].status === 'failed') {
			return 'failed'
		}
		if (auto[index].status === 'passed') {
			return 'passed'
		}
		return index === active ? 'running' : 'pending'
	}

	const summaryFor = (index: number) => {
		if (index >= active) {return undefined}
		switch (index) {
			case 0:
				return repo.name
			case 1:
				return `${selectedJobs.length} jobs · ${runner.label} runner`
			case 2:
			case 3:
			case 4:
				return auto[index].status === 'passed' ? `${checksFor[index].length} checks passed` : undefined
			default:
				return undefined
		}
	}

	/** The confirm row every expanded human step ends with. */
	const stepActions = (label: string, index: number) => @{
		const count = Object.keys(currentErrors).length
		<HStack gap={2} vAlign="center" wrap="wrap">
			<Button label={label} variant="primary" clickAction={confirmStep} />
			{index > 0 ? (
				<Button label="Back" variant="ghost" clickAction={() => goToStep(index - 1)} />
			) : null}
			{count > 0 ? (
				<FieldStatus
					type="error"
					variant="detached"
					message={count === 1 ? 'One problem above needs fixing first.' : `${count} problems above need fixing first.`}
				/>
			) : null}
		</HStack>
	}

	/** The body of an automatic step: its sub-checks, ticking through. */
	const autoBody = (index: number) => @{
		const checks = checksFor[index]
		const state = auto[index]
		const failed = state.status === 'failed'

		<VStack gap={4}>
			<Stepper
				activeStep={state.done}
				orientation="vertical"
				indicatorPosition="on-track"
				accessibilityLabel={`${STEP_META[index].label} checks`}
				style={{ marginInlineStart: NESTED_RAIL_PULL }}
			>
				{checks.map((check, i) => {
					const isPast = i < state.done
					const isCurrent = i === state.done
					return (
						<Step
							key={check.id}
							step={i}
							label={check.label}
							status={isPast ? 'success' : isCurrent && failed ? 'error' : undefined}
							indicator={
								isCurrent && failed ? (
									<Icon name="xplat-error" size={16} />
								) : isCurrent ? (
									<Spinner size="sm" shade="default" />
								) : (
									'auto'
								)
							}
						/>
					)
				})}
			</Stepper>

			{failed && starvedJob != null ? (
				<Banner
					status="error"
					title={`${starvedJob.label} ran out of memory`}
					description={`The job asked for ${starvedJob.memoryGB} GB and the ${runner.label.toLowerCase()} runner has ${runner.memoryGB} GB. Size the runner up, or drop the job from the pipeline.`}
					endContent={
						<Button
							label="Back to the pipeline"
							variant="secondary"
							size="sm"
							clickAction={() => goToStep(1)}
						/>
					}
				/>
			) : null}
		</VStack>
	}

	<Layout
		height="fill"
		contentWidth={800}
		header={
			<LayoutHeader hasDivider={false} padding={5}>
				<HStack gap={3} vAlign="center">
					<StackItem size="fill">
						<VStack gap={0.5}>
							<Heading level={1}>Set up continuous integration</Heading>
							<Text type="supporting" color="secondary">
								Answer the first two steps and the rest check themselves.
							</Text>
						</VStack>
					</StackItem>
				</HStack>
			</LayoutHeader>
		}
		content={
			<LayoutContent>
				<VStack gap={6}>
					<Stepper
						activeStep={active}
						orientation="vertical" accessibilityLabel="Continuous integration setup progress"
						onStepClick={goToStep}
					>
						{STEP_META.map((meta, index) => {
							const phase = phaseOf(index)
							return (
								<Step
									key={meta.label}
									step={index}
									label={meta.label}
									status={
										phase === 'failed' || isStepBroken(index)
											? 'error'
											: phase === 'passed'
												? 'success'
												: undefined
									}
									indicator={
										phase === 'running' ? (
											<Spinner size="sm" shade="default" />
										) : phase === 'failed' ? (
											<Icon name="xplat-error" size={16} />
										) : (
											'auto'
										)
									}
									isDisabled={index > active}
									endContent={
										summaryFor(index) ? (
											<StackItem size="fill">
												<HStack gap={3} vAlign="center" hAlign="end">
													<StackItem size="fill">
														<Text
															type="supporting"
															color="secondary"
															maxLines={1}
														>
															{summaryFor(index)}
														</Text>
													</StackItem>
													<Text
														type="supporting"
														color="accent"
														weight="medium"
													>
														{meta.kind === 'auto' ? 'Run again' : 'Edit'}
													</Text>
												</HStack>
											</StackItem>
										) : undefined
									}
								>
									{index === active ? (
										<VStack paddingBlockEnd={2}>
											{index === 0 ? (
												<FormLayout defaultOptionality="optional">
													<Selector
														label="Repository"
														options={REPOS.map((r) => ({ value: r.id, label: r.name }))}
														value={repoId}
														onValueChange={(v) => setRepoId(v ?? '')}
														description={`${repo.description} Default branch is ${repo.branch}.`}
													/>
													<CheckboxList
														label="Run the pipeline on"
														description="Every event you pick costs build minutes, so start with the one that gates a merge."
														value={triggers}
														onValueChange={(v) => setTriggers(v ?? '')}

														status={currentErrors.triggers ? { type: 'error', message: currentErrors.triggers } : undefined}
													>
														{TRIGGERS.map((t) => (
															<CheckboxListItem key={t.id} value={t.id} label={t.label} description={t.description} />
														))}
													</CheckboxList>
													{stepActions('Continue', index)}
												</FormLayout>
											) : null}

											{index === 1 ? (
												<FormLayout defaultOptionality="optional">
													<CheckboxList
														label="Jobs"
														description="They run in parallel on one machine, so the largest appetite sets the size you need."
														value={jobs}
														onValueChange={(v) => setJobs(v ?? '')}

														status={currentErrors.jobs ? { type: 'error', message: currentErrors.jobs } : undefined}
													>
														{JOBS.map((job) => (
															<CheckboxListItem key={job.id} value={job.id} label={job.label} description={job.description} />
														))}
													</CheckboxList>
													<RadioList
														label="Runner"
														description="Charged per minute while a job is running."
														value={runnerId}
														onValueChange={(v) => setRunnerId(v ?? '')}
													>
														{RUNNERS.map((r) => (
															<RadioListItem
																key={r.id}
																value={r.id}
																label={`${r.label} · ${r.memoryGB} GB`}
																description={`${r.cores} cores, ${r.rate} per minute.`}
															/>
														))}
													</RadioList>
													<Selector
														label="Node version"
														options={NODE_VERSIONS}
														value={nodeVersion}
														onValueChange={(v) => setNodeVersion(v ?? '')}
														description="Used for every job unless a job overrides it."
													/>
													{stepActions('Start checks', index)}
												</FormLayout>
											) : null}

											{index === 5 ? (
												<FormLayout defaultOptionality="optional">
													<Card variant="muted" padding={4}>
														<MetadataList orientation="vertical">
															<MetadataListItem label="Repository" icon={<Icon name="sandbox-cube" size={16} />}>
																{repo.name}
															</MetadataListItem>
															<MetadataListItem label="Triggers" icon={<Icon name="sandbox-bolt" size={16} />}>
																{triggerSummary}
															</MetadataListItem>
															<MetadataListItem label="Runner" icon={<Icon name="sandbox-cpu-chip" size={16} />}>
																{`${runner.label}, ${runner.memoryGB} GB · Node ${nodeVersion}`}
															</MetadataListItem>
															<MetadataListItem label="Toolchain" icon={<Icon name="sandbox-beaker" size={16} />}>
																{`${repo.packageManager} · ${repo.testRunner}, ${repo.testCount.toLocaleString()} tests`}
															</MetadataListItem>
														</MetadataList>
													</Card>
													<Switch
														label="Require branches to be up to date before merging"
														value={strictBranches}
														onChange={(v) => setStrictBranches(v ?? '')}
														labelPosition="start"
														labelSpacing="spread"
													/>
													{stepActions('Enable continuous integration', index)}
												</FormLayout>
											) : null}

											{meta.kind === 'auto' ? autoBody(index) : null}
										</VStack>
									) : null}
								</Step>
							)
						})}
					</Stepper>

					{hasFailure ? (
						<Text type="supporting" color="secondary">
							Setup is paused at the failed step above. Fix what it found and
							the remaining checks will pick up from there.
						</Text>
					) : null}
					{isDone ? (
						<Text type="supporting" color="secondary">
							All checks passed. Continuous integration is enabled for {repo.name}.
						</Text>
					) : null}
				</VStack>
			</LayoutContent>
		}
	/>
}
