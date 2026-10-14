# Speech recognition and chat dictation

Current exports: `useSpeechRecognition`, `useChatDictation`, `ChatDictationButton`.

**Design: Keep capability reporting and make start failures observable.**

The native hook already reports isSupported:false, which is clearer than pretending recognition works. Its start/stop controls return void and the options include browser-specific audioContext:any. Prefer an async start result covering unsupported and permission failures; keep audio engine options in a platform integration or a dedicated speech package.

Proposed shape (illustrative):

```ts
type ProposedSpeechStartResult =
	| { started: true }
	| { started: false; reason: 'unsupported' | 'permission-denied' | 'unavailable' }
```

Evidence: [src/props.ts:4564](../../../../packages/ui/src/props.ts#L4564), [src/props.ts:4577](../../../../packages/ui/src/props.ts#L4577), [src/useSpeechRecognition.tsrx:8](../../../../packages/ui/src/useSpeechRecognition.tsrx#L8).

[Audit index](../../README.md)
