import { useEffect, useRef, useState } from 'octane';

/** A copyable prompt for handing a documented task to a coding agent. */
export function AgentPrompt(props: { prompt: string }) @{
	const [expanded, setExpanded] = useState(false);
	const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
	const actions = useRef<HTMLDetailsElement | null>(null);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		const dismiss = (event: PointerEvent) => {
			if (actions.current && !actions.current.contains(event.target as Node)) {
				actions.current.open = false;
			}
		};

		const escape = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && actions.current?.open) {
				actions.current.open = false;
				actions.current.querySelector('summary')?.focus();
			}
		};

		document.addEventListener('pointerdown', dismiss);
		document.addEventListener('keydown', escape);
		return () => {
			document.removeEventListener('pointerdown', dismiss);
			document.removeEventListener('keydown', escape);
			if (timer.current !== null) clearTimeout(timer.current);
		};
	}, []);

	const copy = async () => {
		if (actions.current) actions.current.open = false;
		try {
			await navigator.clipboard.writeText(props.prompt);
			setCopyState('copied');
		} catch {
			setCopyState('failed');
			setExpanded(true);
		}

		if (timer.current !== null) clearTimeout(timer.current);
		timer.current = setTimeout(() => setCopyState('idle'), 2000);
	};

	<section className="agent-prompt" aria-label="Agent Prompt">
		<div className="agent-prompt-header">
			<div className="agent-prompt-label">
				<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
					<path fill="currentColor" d="M9.18 0a1 1 0 0 1 .61.3l4.42 4.4a1 1 0 0 1 .29.71v8.09A2.5 2.5 0 0 1 12 16H4a2.5 2.5 0 0 1-2.5-2.5V0h7.69M3 13.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V5.62L8.88 1.5H3zm8.63-1.25H4.5V11h7.13zm0-3H4.5V8h7.13zm-5-3H4.5V5h2.13z" />
				</svg>
				Agent Prompt
			</div>
			<div className="agent-prompt-tools">
				<button className="agent-prompt-icon-button" type="button" aria-label="Copy prompt" title="Copy prompt" onClick={copy}>
					<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
						<path className={copyState === 'copied' ? 'agent-prompt-icon' : 'agent-prompt-icon is-visible'} fill="currentColor" fillRule="evenodd" d="M8.25 2c.14 0 .25.11.25.25V3H10v-.75C10 1.28 9.22.5 8.25.5h-5.5C1.78.5 1 1.28 1 2.25v7.5c0 .97.78 1.75 1.75 1.75H4.5V10H2.75a.25.25 0 0 1-.25-.25v-7.5c0-.14.11-.25.25-.25zm5 4c.14 0 .25.11.25.25v7.5q-.02.23-.25.25h-5.5a.25.25 0 0 1-.25-.25v-7.5c0-.14.11-.25.25-.25zm0 9.5c.97 0 1.75-.78 1.75-1.75v-7.5c0-.97-.78-1.75-1.75-1.75h-5.5C6.78 4.5 6 5.28 6 6.25v7.5c0 .97.78 1.75 1.75 1.75z" />
						<path className={copyState === 'copied' ? 'agent-prompt-icon is-visible' : 'agent-prompt-icon'} fill="currentColor" d="m15.56 4-.53.53-8.8 8.8c-.68.68-1.78.68-2.47 0l-2.79-2.79L.44 10 1.5 8.94l.53.53 2.8 2.8c.1.09.25.09.35 0l8.79-8.8.53-.53z" />
					</svg>
				</button>
				<details className="agent-prompt-actions" ref={actions}>
					<summary className="agent-prompt-icon-button" aria-label="Open prompt actions" title="Open prompt actions">
						<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="m14.06 5.5-.53.53-4.82 4.82a1 1 0 0 1-1.42 0L2.47 6.03l-.53-.53L3 4.44l.53.53L8 9.44l4.47-4.47.53-.53z" /></svg>
					</summary>
					<div className="agent-prompt-menu">
						<button type="button" onClick={copy}>Copy prompt</button>
						<a href={`https://chatgpt.com/?q=${encodeURIComponent(props.prompt)}`} target="_blank" rel="noopener noreferrer" onClick={() => { if (actions.current) actions.current.open = false; }}>Open in ChatGPT</a>
					</div>
				</details>
			</div>
		</div>
		<div className="agent-prompt-body">
			<div className={expanded ? 'agent-prompt-text is-expanded' : 'agent-prompt-text'} data-nosnippet="">
				<p>{props.prompt}</p>
			</div>
			<span className={copyState === 'failed' ? 'agent-prompt-status is-error' : 'agent-prompt-status'} role="status">{copyState === 'copied' ? 'Prompt copied' : copyState === 'failed' ? 'Could not copy. Select the prompt text to copy it.' : ''}</span>
			<button className="agent-prompt-expand" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? 'Show less' : 'Show more'}</button>
		</div>
	</section>
}
