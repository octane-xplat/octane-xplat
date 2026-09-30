// Simple haptics service — the platform `haptics` capability contract over
// this leaf's own engine (Pulsar on native, Vibration API on web), so no
// second plugin is needed.
import { createHaptics } from "./haptics";
import type { Capability, HapticsImpl } from "./types";

const engine = createHaptics();

export const haptics: Capability<HapticsImpl> = {
	get supported() {
		return engine.capabilities().supported;
	},
	async ensure() {
		return engine.capabilities().supported ? "granted" : "unsupported";
	},
	impl: {
		impact: (style = "light") => void engine.play(`impact-${style}`),
		notification: (kind) => void engine.play(kind),
		selection: () => void engine.play("selection"),
	},
};
