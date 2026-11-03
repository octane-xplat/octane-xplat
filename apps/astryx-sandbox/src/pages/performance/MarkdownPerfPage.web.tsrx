/** @jsxImportSource @octane-xplat/jsx/dom */
// Copyright (c) Meta Platforms, Inc. and affiliates.
// Ported from facebook/astryx apps/sandbox/src/app/(fullscreen)/pages/markdown-perf/page.tsx
// (pinned revision ebd939b665361a078015377c0dfe50cc3c1d70a4). The upstream
// benchmark is unchanged; only the component vocabulary moved to Octane.

'use client'

/**
 * @input Deterministic Markdown fixtures, selectable plugin profiles, and streamed bursts
 * @output Interactive baseline comparison with paint, mutation, and frame metrics
 * @position Fullscreen sandbox tool for validating Markdown performance and animation
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'octane'
import { AppShell } from '@octane-xplat/ui'
import { Badge } from '@octane-xplat/ui'
import { Button } from '@octane-xplat/ui'
import { Card } from '@octane-xplat/ui'
import { Grid } from '@octane-xplat/ui'
import { Section } from '@octane-xplat/ui'
import { SegmentedControl, SegmentedControlItem } from '@octane-xplat/ui'
import { HStack, VStack } from '@octane-xplat/ui'
import { Heading, Text } from '@octane-xplat/ui'
import { Markdown } from '@octane-xplat/ui/markdown'
import {
	formatBenchmarkChange,
	generateMarkdownFixture,
	nextStreamOffset,
} from './markdown-benchmark'

import {
	getMarkdownBenchmarkPlugins,
	getMarkdownBenchmarkProfile,
	MARKDOWN_BENCHMARK_PROFILES,
	type MarkdownBenchmarkClaimDensity,
	type MarkdownBenchmarkPipeline,
	type MarkdownBenchmarkProfileId,
} from './markdown-benchmark-profiles'

type BenchmarkMode = 'complete' | 'streaming'

interface BenchmarkMetrics {
	firstPaintMs: number | null
	completeMs: number | null
	mutationBatches: number | null
	frames: number | null
	droppedFrames: number | null
}

const EMPTY_METRICS: BenchmarkMetrics = {
	firstPaintMs: null,
	completeMs: null,
	mutationBatches: null,
	frames: null,
	droppedFrames: null,
}

const SECTION_OPTIONS = ['10', '50', '200', '500']
const BURST_OPTIONS = ['64', '256', '1024']
const SETTLE_DELAY_MS = 180
const BURST_INTERVAL_MS = 80

function formatDuration(value: number | null): string {
	return value == null ? '—' : `${value.toFixed(1)} ms`
}

function formatCount(value: number | null): string {
	return value == null ? '—' : value.toLocaleString()
}

function formatFrameCounts(frames: number | null, droppedFrames: number | null): string {
	return frames == null || droppedFrames == null
		? '—'
		: `${frames.toLocaleString()} / ${droppedFrames.toLocaleString()}`
}

function comparisonKey(
	profileId: MarkdownBenchmarkProfileId,
	claimDensity: MarkdownBenchmarkClaimDensity,
	mode: BenchmarkMode,
	sectionCount: string,
	burstSize: string,
): string {
	return `${profileId}:${claimDensity}:${mode}:${sectionCount}:${mode === 'streaming' ? burstSize : 'all'}`
}

export function MarkdownPerfPage() {
	const [mode, setMode] = useState<BenchmarkMode>('streaming')
	const [pipeline, setPipeline] = useState<MarkdownBenchmarkPipeline>('baseline')
	const [profileId, setProfileId] = useState<MarkdownBenchmarkProfileId>('soft-breaks')
	const [claimDensity, setClaimDensity] = useState<MarkdownBenchmarkClaimDensity>('sparse')
	const [sectionCount, setSectionCount] = useState('50')
	const [burstSize, setBurstSize] = useState('256')
	const [renderedSource, setRenderedSource] = useState('')
	const [isStreaming, setIsStreaming] = useState(false)
	const [isRunning, setIsRunning] = useState(false)
	const [runKey, setRunKey] = useState(0)
	const [metrics, setMetrics] = useState<BenchmarkMetrics>(EMPTY_METRICS)
	const [baselines, setBaselines] = useState<Record<string, BenchmarkMetrics>>({})

	const surfaceRef = useRef<HTMLDivElement | null>(null)
	const startTimeRef = useRef(0)
	const firstPaintRef = useRef<number | null>(null)
	const mutationBatchesRef = useRef(0)
	const producerDoneRef = useRef(false)
	const runningRef = useRef(false)
	const frameRef = useRef({ id: 0, frames: 0, dropped: 0, previous: 0 })
	const feedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
	const resetFrameRef = useRef<number | null>(null)
	const activeRunRef = useRef<{
		readonly baselineKey: string
		readonly pipeline: MarkdownBenchmarkPipeline
	} | null>(null)

	const profile = getMarkdownBenchmarkProfile(profileId)
	const plugins = getMarkdownBenchmarkPlugins(profile, pipeline)
	const baseFixture = useMemo(() => generateMarkdownFixture(Number(sectionCount)), [sectionCount])
	const fixture = useMemo(
		() => profile.prepareSource(baseFixture, claimDensity),
		[baseFixture, claimDensity, profile],
	)

	const currentComparisonKey = comparisonKey(profileId, claimDensity, mode, sectionCount, burstSize)
	const baseline = baselines[currentComparisonKey]

	const stopTimers = useCallback(() => {
		if (feedTimerRef.current != null) {
			clearTimeout(feedTimerRef.current)
			feedTimerRef.current = null
		}

		if (settleTimerRef.current != null) {
			clearTimeout(settleTimerRef.current)
			settleTimerRef.current = null
		}

		if (resetFrameRef.current != null) {
			cancelAnimationFrame(resetFrameRef.current)
			resetFrameRef.current = null
		}

		cancelAnimationFrame(frameRef.current.id)
	}, [])

	const finish = useCallback(() => {
		if (!runningRef.current) {
			return
		}

		runningRef.current = false
		setIsRunning(false)
		cancelAnimationFrame(frameRef.current.id)
		const nextMetrics = {
			firstPaintMs: firstPaintRef.current,
			completeMs: performance.now() - startTimeRef.current,
			mutationBatches: mutationBatchesRef.current,
			frames: frameRef.current.frames,
			droppedFrames: frameRef.current.dropped,
		}

		setMetrics(nextMetrics)
		const activeRun = activeRunRef.current
		if (activeRun?.pipeline === 'baseline') {
			setBaselines((current) => ({
				...current,
				[activeRun.baselineKey]: nextMetrics,
			}))
		}
	}, [])

	const scheduleFinish = useCallback(() => {
		if (!producerDoneRef.current || !runningRef.current) {
			return
		}

		if (settleTimerRef.current != null) {
			clearTimeout(settleTimerRef.current)
		}

		settleTimerRef.current = setTimeout(finish, SETTLE_DELAY_MS)
	}, [finish])

	useEffect(() => {
		const surface = surfaceRef.current
		if (surface == null) {
			return
		}

		const observer = new MutationObserver(() => {
			if (!runningRef.current) {
				return
			}

			mutationBatchesRef.current += 1
			firstPaintRef.current ??= performance.now() - startTimeRef.current
			setMetrics((current) => ({
				...current,
				firstPaintMs: firstPaintRef.current,
				mutationBatches: mutationBatchesRef.current,
			}))

			scheduleFinish()
		})

		observer.observe(surface, {
			childList: true,
			subtree: true,
			characterData: true,
		})

		return () => observer.disconnect()
	}, [scheduleFinish])

	useEffect(() => stopTimers, [stopTimers])

	useEffect(() => {
		if (!runningRef.current) {
			setRenderedSource('')
			setMetrics(EMPTY_METRICS)
		}
	}, [burstSize, claimDensity, mode, pipeline, profileId, sectionCount])

	const startFrameMeasurement = useCallback(() => {
		const frameState = frameRef.current
		frameState.frames = 0
		frameState.dropped = 0
		frameState.previous = performance.now()

		const measureFrame = (now: number) => {
			if (!runningRef.current) {
				return
			}

			frameState.frames += 1
			if (now - frameState.previous > 20) {
				frameState.dropped += 1
			}

			frameState.previous = now
			frameState.id = requestAnimationFrame(measureFrame)
		}

		frameState.id = requestAnimationFrame(measureFrame)
	}, [])

	const startBenchmark = useCallback(() => {
		stopTimers()
		runningRef.current = false
		setIsRunning(false)
		setIsStreaming(mode === 'streaming')
		setRenderedSource('')
		setRunKey((value) => value + 1)
		setMetrics(EMPTY_METRICS)
		activeRunRef.current = {
			baselineKey: currentComparisonKey,
			pipeline,
		}

		resetFrameRef.current = requestAnimationFrame(() => {
			resetFrameRef.current = requestAnimationFrame(() => {
				startTimeRef.current = performance.now()
				firstPaintRef.current = null
				mutationBatchesRef.current = 0
				producerDoneRef.current = false
				runningRef.current = true
				setIsRunning(true)
				startFrameMeasurement()

				if (mode === 'complete') {
					producerDoneRef.current = true
					setIsStreaming(false)
					setRenderedSource(fixture)
					scheduleFinish()
					return
				}

				let offset = 0
				const feed = () => {
					offset = nextStreamOffset(fixture.length, offset, Number(burstSize))
					setRenderedSource(fixture.slice(0, offset))
					if (offset < fixture.length) {
						feedTimerRef.current = setTimeout(feed, BURST_INTERVAL_MS)
						return
					}

					producerDoneRef.current = true
					setIsStreaming(false)
					scheduleFinish()
				}

				feed()
			})
		})
	}, [
		burstSize,
		currentComparisonKey,
		fixture,
		mode,
		pipeline,
		scheduleFinish,
		startFrameMeasurement,
		stopTimers,
	])

	const stopBenchmark = useCallback(() => {
		stopTimers()
		runningRef.current = false
		setIsRunning(false)
		setIsStreaming(false)
	}, [stopTimers])

	const progress =
		fixture.length === 0 ? 0 : Math.round((renderedSource.length / fixture.length) * 100)

	return (
		<AppShell contentPadding={4} height="fill">
			<VStack gap={4}>
				<VStack gap={1}>
					<Heading level={2}>Markdown Performance</Heading>
					<Text type="body" color="secondary">
						Compare a complete render with bursty streamed input while observing first paint, total
						completion, DOM mutation batches, and dropped animation frames.
					</Text>
				</VStack>

				<Section variant="muted" padding={3} dividers={['bottom']}>
					<HStack gap={4} vAlign="center" wrap="wrap">
						<SegmentedControl
							label="Plugin profile"
							value={profileId}
							onValueChange={(value) => setProfileId(value as MarkdownBenchmarkProfileId)}
							isDisabled={isRunning}
							disabledMessage="Stop the active run before changing profiles."
							size="sm"
						>
							{MARKDOWN_BENCHMARK_PROFILES.map((entry) => (
								<SegmentedControlItem key={entry.id} value={entry.id} label={entry.label} />
							))}
						</SegmentedControl>
						<SegmentedControl
							label="Pipeline"
							value={pipeline}
							onValueChange={(value) => setPipeline(value as MarkdownBenchmarkPipeline)}
							isDisabled={isRunning}
							disabledMessage="Stop the active run before changing pipelines."
							size="sm"
						>
							<SegmentedControlItem value="baseline" label="Empty" />
							<SegmentedControlItem value="plugin" label="Plugin" />
						</SegmentedControl>
						<SegmentedControl
							label="Claim density"
							value={claimDensity}
							onValueChange={(value) => setClaimDensity(value as MarkdownBenchmarkClaimDensity)}
							isDisabled={isRunning}
							disabledMessage="Stop the active run before changing claim density."
							size="sm"
						>
							<SegmentedControlItem value="none" label="No claims" />
							<SegmentedControlItem value="sparse" label="Sparse" />
							<SegmentedControlItem value="dense" label="Dense" />
						</SegmentedControl>
						<SegmentedControl
							label="Render mode"
							value={mode}
							onValueChange={(value) => setMode(value as BenchmarkMode)}
							isDisabled={isRunning}
							disabledMessage="Stop the active run before changing render mode."
							size="sm"
						>
							<SegmentedControlItem value="complete" label="Complete" />
							<SegmentedControlItem value="streaming" label="Streaming" />
						</SegmentedControl>
						<SegmentedControl
							label="Section count"
							value={sectionCount}
							onValueChange={setSectionCount}
							isDisabled={isRunning}
							disabledMessage="Stop the active run before changing section count."
							size="sm"
						>
							{SECTION_OPTIONS.map((value) => (
								<SegmentedControlItem key={value} value={value} label={value} />
							))}
						</SegmentedControl>
						<SegmentedControl
							label="Burst size"
							value={burstSize}
							onValueChange={setBurstSize}
							isDisabled={mode !== 'streaming' || isRunning}
							disabledMessage={
								isRunning
									? 'Stop the active run before changing burst size.'
									: 'Burst size applies only to streaming runs.'
							}
							size="sm"
						>
							{BURST_OPTIONS.map((value) => (
								<SegmentedControlItem key={value} value={value} label={`${value} chars`} />
							))}
						</SegmentedControl>
						<Button
							label={isRunning ? 'Restart benchmark' : 'Run benchmark'}
							clickAction={startBenchmark}
						/>
						<Button
							label="Stop"
							variant="secondary"
							clickAction={stopBenchmark}
							isDisabled={!isRunning}
						/>
					</HStack>
				</Section>

				<Grid columns={['*', '*']} style={{ gap: 16 }}>
					<Card padding={3}>
						<VStack gap={3}>
							<Heading level={3}>Run metrics</Heading>
							<HStack gap={2} wrap="wrap">
								<Badge label={profile.label} />
								<Badge label={pipeline === 'baseline' ? 'Empty' : 'Plugin'} />
								<Badge label={`${claimDensity} claims`} />
								<Badge label={mode === 'streaming' ? 'Streaming' : 'Complete'} />
								<Badge label={`${Number(sectionCount).toLocaleString()} sections`} />
								<Badge label={`${fixture.length.toLocaleString()} characters`} />
								<Badge label={`${progress}% received`} />
							</HStack>
							<Grid columns={['*', '*']} style={{ gap: 12 }}>
								<VStack gap={0.5}>
									<Text type="label">First paint</Text>
									<Text type="code">
										{formatDuration(metrics.firstPaintMs)} ·{' '}
										{formatBenchmarkChange(metrics.firstPaintMs, baseline?.firstPaintMs ?? null)}
									</Text>
								</VStack>
								<VStack gap={0.5}>
									<Text type="label">Complete</Text>
									<Text type="code">
										{formatDuration(metrics.completeMs)} ·{' '}
										{formatBenchmarkChange(metrics.completeMs, baseline?.completeMs ?? null)}
									</Text>
								</VStack>
								<VStack gap={0.5}>
									<Text type="label">DOM mutation batches</Text>
									<Text type="code">
										{formatCount(metrics.mutationBatches)} ·{' '}
										{formatBenchmarkChange(
											metrics.mutationBatches,
											baseline?.mutationBatches ?? null,
										)}
									</Text>
								</VStack>
								<VStack gap={0.5}>
									<Text type="label">Frames / drops</Text>
									<Text type="code">
										{formatFrameCounts(metrics.frames, metrics.droppedFrames)} ·{' '}
										{formatBenchmarkChange(metrics.droppedFrames, baseline?.droppedFrames ?? null)}
									</Text>
								</VStack>
							</Grid>
							<Text type="body" color="secondary">
								Each metric includes its change from the latest matching baseline. For each workload
								and density, run the Empty pipeline before the Plugin pipeline. A dropped frame is a
								measured animation-frame gap over 20 ms. Completion waits for the rendered subtree
								to stay unchanged for 180 ms after the final source burst.
							</Text>
						</VStack>
					</Card>

					<Card padding={4}>
						<div ref={surfaceRef}>
							{plugins.length === 0 ? (
								<Markdown key={runKey} isStreaming={isStreaming} contentWidth={760}>
									{renderedSource}
								</Markdown>
							) : (
								<Markdown
									key={runKey}
									isStreaming={isStreaming}
									contentWidth={760}
									plugins={plugins}
								>
									{renderedSource}
								</Markdown>
							)}
						</div>
					</Card>
				</Grid>
			</VStack>
		</AppShell>
	)
}
