import { Utils } from "@nativescript/core";
import type {
  AudioCapabilities,
  AudioPlayer,
  AudioSnapshot,
  Track,
} from "./types";

export const createAudioPlayer = (): AudioPlayer => {
  const actions = com.xplat.audio.AudioBridge;
  const context = Utils.android.getApplicationContext();
  const listeners = new Set<(snapshot: AudioSnapshot) => void>();
  let queue: Track[] = [];
  let index = -1;
  let disposed = false;
  let poll: ReturnType<typeof setInterval> | undefined;

  const snapshot = (): AudioSnapshot => {
    const value = JSON.parse(actions.snapshot()) as {
      state: AudioSnapshot["state"];
      index?: number;
      currentTime?: number;
      duration?: number;
      error?: string;
    };

    if (Number.isInteger(value.index) && value.index! >= 0) {index = value.index!;}
    return {
      state: value.state,
      track: queue[index],
      currentTime: value.currentTime ?? 0,
      duration: value.duration ?? 0,
      error: value.error ? new Error(value.error) : undefined,
    };
  };

  const emit = () => {
    const value = snapshot();
    for (const listener of listeners) {listener(value);}
  };

  const dispatch = (action: string, payload = "", at = 0, seconds = 0) => {
    if (disposed) {throw new Error("AudioPlayer is disposed");}
    actions.dispatch(context, action, payload, at, seconds);
  };

  const ensurePolling = () => {
    if (listeners.size && !poll) {poll = setInterval(emit, 250);}
    if (!listeners.size && poll) {
      clearInterval(poll);
      poll = undefined;
    }
  };

  return {
    capabilities: (): AudioCapabilities => ({
      supported: true,
      backgroundPlayback: true,
      systemControls: true,
      userGestureRequired: false,
      interruptions: true,
    }),
    snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      listener(snapshot());
      ensurePolling();
      return () => {
        listeners.delete(listener);
        ensurePolling();
      };
    },
    setQueue: async (tracks, startAt = 0) => {
      if (disposed) {throw new Error("AudioPlayer is disposed");}
      queue = [...tracks];
      index = queue.length
        ? Math.max(0, Math.min(Number.isFinite(startAt) ? Math.floor(startAt) : 0, queue.length - 1))
        : -1;

      dispatch(actions.ACTION_QUEUE, JSON.stringify(queue), index);
      emit();
    },
    play: async () => dispatch(actions.ACTION_PLAY),
    pause: async () => dispatch(actions.ACTION_PAUSE),
    seek: async (seconds) => {
      if (Number.isFinite(seconds)) {dispatch(actions.ACTION_SEEK, "", 0, Math.max(0, seconds));}
      emit();
    },
    dispose: () => {
      if (disposed) {return;}
      disposed = true;
      actions.dispatch(context, actions.ACTION_RELEASE, "", 0, 0);
      if (poll) {clearInterval(poll);}
      poll = undefined;
      listeners.clear();
      queue = [];
      index = -1;
    },
  };
};
