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

	<section id="agent-prompt" className="agent-prompt" aria-label="Agent Prompt">
		<div className="agent-prompt-header">
			<div className="agent-prompt-label">
				<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" color="currentColor" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
					<path d="M2.5 12C2.5 7.52166 2.5 5.28249 3.89124 3.89124C5.28249 2.5 7.52166 2.5 12 2.5C16.4783 2.5 18.7175 2.5 20.1088 3.89124C21.5 5.28249 21.5 7.52166 21.5 12C21.5 16.4783 21.5 18.7175 20.1088 20.1088C18.7175 21.5 16.4783 21.5 12 21.5C7.52166 21.5 5.28249 21.5 3.89124 20.1088C2.5 18.7175 2.5 16.4783 2.5 12Z" />
					<path d="M9.5 9.5L7.96682 10.8215C7.32228 11.377 7 11.6548 7 12C7 12.3452 7.32227 12.623 7.96682 13.1785L9.5 14.5" />
					<path d="M14.5 9.5L16.0332 10.8215C16.6777 11.377 17 11.6548 17 12C17 12.3452 16.6777 12.623 16.0332 13.1785L14.5 14.5" />
				</svg>
				Agent Prompt
			</div>
			<div className="agent-prompt-tools">
				<button className="agent-prompt-icon-button" type="button" aria-label="Copy prompt" title="Copy prompt" onClick={copy}>
					<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
						<g className={`doc-copy-icon agent-prompt-icon${copyState === 'copied' ? '' : ' is-visible'}`}>
							<rect x="6" y="6" width="8.66666667" height="8.66666667" rx="1.33333333" />
							<path d="M3.33333333,10 L2.66666667,10 C1.93028699,10 1.33333333,9.40304633 1.33333333,8.66666667 L1.33333333,2.66666667 C1.33333333,1.93028699 1.93028699,1.33333333 2.66666667,1.33333333 L8.66666667,1.33333333 C9.40304633,1.33333333 10,1.93028699 10,2.66666667 L10,3.33333333" />
						</g>
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
