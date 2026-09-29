import { HumanQA } from '../HumanQA.tsrx';

/** qa route — the human-verdict checklist (harness probes can't assert
 *  sensory output, hit-testing, or physical hardware). Pushed into the
 *  Test stack; a real /qa URL on web. */
export function Qa(props: { _stack?: string }) @{
	<HumanQA _stack={props._stack} />
}
