// Port of upstream templates/pages/ai-chat/page.tsx (Astryx 0.6.4, MIT) —
// route /templates/ai-chat/.
// GAPS: chat primitives via `@octane-xplat/ui/chat`, Markdown via
// `@octane-xplat/ui/markdown` (subpath exports, recorded finding); the
// upstream container-query CSS that hides the resize handle on narrow hosts
// is approximated with useMediaQuery at the same 768px breakpoint.
import { useRef, useState } from 'octane'
import {
	Avatar, Button, Card, ClickableCard, CodeBlock, Dialog, DialogHeader,
	DropdownMenu, Heading, HStack, Icon, Layout, LayoutContent,
	ResizeHandle, StackItem, Text, Timestamp, Toolbar, Token,
	useMediaQuery, useResizable, VStack,
} from '@octane-xplat/ui'
import {
	ChatComposer, ChatComposerInput, ChatLayout, ChatMessage,
	ChatMessageBubble, ChatMessageList, ChatMessageMetadata,
	ChatSystemMessage, ChatTokenizedText, ChatToolCalls,
} from '@octane-xplat/ui/chat'
import { Markdown } from '@octane-xplat/ui/markdown'

const MOBILE_MAX_WIDTH = 768

const MENTION_TOKENS = [{ value: '@agent', label: '@Agent', variant: 'blue' as const }]

const ARTIFACT_TITLE = 'JWT Token Refresh: Design & Rollout'
const ARTIFACT_SUBTITLE = 'Document · Updated just now'

const ARTIFACT_CONTENT = `## Overview

Our API gateway authenticates every request with a short-lived JWT access token. Until now, an expired token meant an immediate \`401\` — even when the user still held a valid refresh token. This document describes the silent-refresh flow we just shipped and how we're rolling it out.

## The Problem

Token validation ran **before** any refresh logic, so the middleware rejected expired tokens outright:

1. A request arrives with an expired access token
2. \`validateToken()\` throws \`TokenExpiredError\`
3. The catch block returns \`401\` — \`refreshToken()\` is never reached

The result was users getting logged out whenever an access token lapsed mid-session.

## The Fix

The middleware now catches \`TokenExpiredError\` specifically and attempts a silent refresh before rejecting. On success it reissues an access token and continues the request; on failure it falls back to \`401\`.

- **Transparent** — valid sessions never see an interruption
- **Safe** — a missing or invalid refresh token still returns \`401\`
- **Cheap** — refresh only runs on the expiry path, not on every request

## Testing

The refresh path is covered end to end:

| Scenario | Expected |
|----------|----------|
| Valid token passes through | \`200\` |
| Expired token, valid refresh | \`200\` + new access token |
| Expired token, invalid refresh | \`401\` |
| Malformed token | \`401\` |

## Rollout & Monitoring

1. Ship behind the \`silent_refresh\` flag at 5% of traffic
2. Watch the \`auth.refresh.success\` and \`auth.refresh.failure\` counters
3. Alert if the failure rate exceeds **2%** over any 5-minute window
4. Ramp to 100% once metrics hold steady for 24 hours`

const FIX_CODE = `async function authMiddleware(req: Request) {
  try {
    const decoded = validateToken(req.headers.authorization);
    req.user = decoded;
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      const refreshed = await refreshToken(req.cookies.refreshToken);
      if (refreshed) {
        req.user = refreshed.user;
        req.newAccessToken = refreshed.accessToken;
        return next(req);
      }
    }
    return new Response('Unauthorized', { status: 401 });
  }
}`

function ArtifactActions(props: { onClose?: () => void }) @{
	<>
		<DropdownMenu
			button={{ label: 'v2', variant: 'ghost', size: 'sm' }}
			items={[
				{ type: 'action', key: 'v2', label: 'v2 (current)', onSelect: () => {} },
				{ type: 'action', key: 'v1', label: 'v1', onSelect: () => {} },
			]}
		/>
		<Button label="Copy" variant="ghost" size="sm" icon={<Icon name="sandbox-clipboard-document" size={16} />} isIconOnly clickAction={() => {}} />
		<Button label="Share" variant="ghost" size="sm" icon={<Icon name="sandbox-share" size={16} />} isIconOnly clickAction={() => {}} />
		{props.onClose != null ? (
			<Button label="Close document" variant="ghost" size="sm" icon={<Icon name="sandbox-x-mark" size={16} />} isIconOnly clickAction={props.onClose} />
		) : null}
	</>
}

function ArtifactBody() @{
	<VStack gap={2} padding={4}>
		<Heading level={1}>{ARTIFACT_TITLE}</Heading>
		<Text type="supporting" color="secondary">
			{ARTIFACT_SUBTITLE}
		</Text>
		<Markdown text={ARTIFACT_CONTENT} />
	</VStack>
}

function ArtifactCard(props: { onOpen: () => void }) @{
	<ClickableCard
		label={`Open ${ARTIFACT_TITLE}`}
		onPress={props.onOpen}
		variant="muted"
		padding={3}
		width={360}
	>
		<HStack gap={3} vAlign="center" width="100%">
			<Icon name="sandbox-document-text" size={20} color="secondary" />
			<StackItem size="fill">
				<VStack gap={0}>
					<Text type="label" weight="semibold">{ARTIFACT_TITLE}</Text>
					<Text type="supporting" color="secondary">Document</Text>
				</VStack>
			</StackItem>
			<Icon name="sandbox-chevron-right" size={16} color="secondary" />
		</HStack>
	</ClickableCard>
}

export function AIChatTemplate() @{
	const [composerMode, setComposerMode] = useState('ask')
	const [isArtifactDialogOpen, setIsArtifactDialogOpen] = useState(false)
	const [isArtifactOpen, setIsArtifactOpen] = useState(true)

	const isNarrow = useMediaQuery(`(max-width: ${MOBILE_MAX_WIDTH}px)`)
	const artifactResize = useResizable({
		defaultSize: 640,
		minSize: 480,
		maxSize: 960,
	})

	const openArtifact = () => {
		if (isNarrow) {
			setIsArtifactDialogOpen(true)
		} else {
			setIsArtifactOpen(true)
		}
	}

	<>
		<Layout
			height="fill"
			content={
				<LayoutContent padding={0}>
					<VStack height="fill">
						<ChatLayout
							composer={
								<ChatComposer
									input={
										<ChatComposerInput
											placeholder="Ask anything…"
										/>
									}
									footerActions={
										<DropdownMenu
											button={{ label: composerMode === 'ask' ? 'Ask' : 'Edit', variant: 'ghost', size: 'sm' }}
											items={[
												{ type: 'action', key: 'ask', label: 'Ask', onSelect: () => setComposerMode('ask') },
												{ type: 'action', key: 'edit', label: 'Edit', onSelect: () => setComposerMode('edit') },
											]}
										/>
									}
								/>
							}
						>
							<ChatMessageList>
								<ChatSystemMessage variant="divider">Today</ChatSystemMessage>

								<ChatMessage sender="user">
									<HStack gap={1} wrap="wrap">
										<Token label="auth-service.ts" />
										<Token label="middleware.ts" />
									</HStack>
									<ChatMessageBubble
										metadata={
											<ChatMessageMetadata
												timestamp={<Timestamp value={Date.parse("2026-04-29T10:15:00")} valueUnit="unix-milliseconds" format="time" />}
											/>
										}
									>
										<ChatTokenizedText
>
											@agent Can you review these auth files? The JWT refresh
											logic seems broken — tokens expire but the middleware
											doesn't catch it.
										</ChatTokenizedText>
									</ChatMessageBubble>
								</ChatMessage>

								<ChatMessage sender="assistant" avatar={<Avatar name="Agent" size="md" />}>
									<ChatMessageBubble variant="ghost">
										Looking into the auth files now. Let me read through the
										code and trace the token refresh flow.
									</ChatMessageBubble>
									<ChatToolCalls
										defaultIsExpanded
										calls={[
											{ name: 'read', target: 'auth-service.ts', status: 'complete', duration: '45ms' },
											{ name: 'read', target: 'middleware.ts', status: 'complete', duration: '38ms' },
											{ name: 'bash', target: 'grep -rn "refreshToken" src/', status: 'complete', duration: '120ms', node: 'cli:remote-server' },
										]}
									/>
									<ChatMessageBubble variant="ghost">
										<Markdown density="compact" text={`Found the issue. In \`middleware.ts\`, the token validation runs **before** the refresh check. When a token expires, the middleware rejects the request immediately instead of attempting a refresh.\n\nHere's the problematic sequence:\n\n1. Request arrives with an expired access token\n2. \`validateToken()\` throws \`TokenExpiredError\`\n3. The catch block returns \`401\` — never reaching \`refreshToken()\`\n\nThe fix is to catch \`TokenExpiredError\` specifically and attempt a refresh before rejecting:`} />
									</ChatMessageBubble>
									<ChatMessageBubble variant="ghost">
										<CodeBlock title="middleware.ts" language="typescript" code={FIX_CODE} />
									</ChatMessageBubble>
									<ChatMessageBubble variant="ghost">
										<Markdown density="compact" text={`Now when an access token expires mid-session, the refresh runs transparently and the request continues — no interruption for the user.\n\nWant me to write this up as a design doc for the team?`} />
									</ChatMessageBubble>
								</ChatMessage>

								<ChatMessage sender="assistant" avatar={<Avatar name="Agent" size="md" />}>
									<ChatMessageBubble variant="ghost">
										<Markdown density="compact" text={`I've drafted a design doc covering the problem, the fix, and the test matrix — pulling straight from the changes we just made.\n\nOpen the document below to review it. Want me to expand any section?`} />
									</ChatMessageBubble>
									<ChatMessageBubble
										variant="ghost"
										width="100%"
										metadata={
											<ChatMessageMetadata
												timestamp={<Timestamp value={Date.parse("2026-04-29T10:18:40")} valueUnit="unix-milliseconds" format="time" />}
											/>
										}
									>
										<ArtifactCard onOpen={openArtifact} />
									</ChatMessageBubble>
								</ChatMessage>

								<ChatMessage sender="user">
									<ChatMessageBubble
										metadata={
											<ChatMessageMetadata
												timestamp={<Timestamp value={Date.parse("2026-04-29T10:20:00")} valueUnit="unix-milliseconds" format="time" />}
												status="delivered"
											/>
										}
									>
										This is great. Can you add a section on rollout and
										monitoring at the end?
									</ChatMessageBubble>
								</ChatMessage>

								<ChatMessage sender="assistant" avatar={<Avatar name="Agent" size="md" />}>
									<ChatMessageBubble variant="ghost">
										<Markdown density="compact" text={`On it — adding a **Rollout & Monitoring** section with a staged flag ramp and the alert thresholds. Updating the document now.`} />
									</ChatMessageBubble>
									<ChatToolCalls
										calls={[
											{ name: 'edit', target: 'docs/token-refresh.md', status: 'running', node: 'cli:remote-server' },
										]}
									/>
									<ChatMessageMetadata
										timestamp={<Timestamp value={Date.parse("2026-04-29T10:20:30")} valueUnit="unix-milliseconds" format="time" />}
									/>
								</ChatMessage>
							</ChatMessageList>
						</ChatLayout>
					</VStack>
				</LayoutContent>
			}
			end={
				isArtifactOpen && !isNarrow ? (
					<>
						<ResizeHandle
							direction="horizontal"
							resizable={artifactResize.props}
							isReversed
							pillPlacement="start"
							hasDivider
							label="Resize artifact panel"
						/>
						<Card
							variant="transparent"
							height="100%"
							style={{
								width: artifactResize.size,
								flexShrink: 0,
								overflow: 'hidden',
								display: 'flex',
								flexDirection: 'column',
							}}
						>
							<Toolbar
								label="Artifact actions"
								dividers={['bottom']}
								startContent={
									<HStack gap={3} vAlign="center">
										<Icon name="sandbox-document-text" size={16} color="secondary" />
										<VStack gap={0}>
											<Text type="label" weight="semibold">{ARTIFACT_TITLE}</Text>
											<Text type="supporting" color="secondary">{ARTIFACT_SUBTITLE}</Text>
										</VStack>
									</HStack>
								}
								endContent={<ArtifactActions onClose={() => setIsArtifactOpen(false)} />}
							/>
							<LayoutContent>
								<ArtifactBody />
							</LayoutContent>
						</Card>
					</>
				) : undefined
			}
		/>
		{isNarrow ? (
			<Dialog
				isOpen={isArtifactDialogOpen}
				onOpenChange={setIsArtifactDialogOpen}
			>
				<DialogHeader title={ARTIFACT_TITLE} onOpenChange={setIsArtifactDialogOpen} />
				<LayoutContent>
					<ArtifactBody />
				</LayoutContent>
			</Dialog>
		) : null}
	</>
}
