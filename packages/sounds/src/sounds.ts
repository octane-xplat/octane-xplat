import {
  AudioContext,
  type AudioBuffer,
  type AudioBufferSourceNode,
  type GainNode,
} from "@nativescript/audio-context";

import type {
  SoundBank,
  SoundBankOptions,
  SoundCapabilities,
  SoundSource,
} from "./types";

type Clip = { source: SoundSource; buffer?: AudioBuffer; loading?: Promise<AudioBuffer> };
type Voice = { source: AudioBufferSourceNode; gain: GainNode; name: string };

const uriFor = (source: SoundSource) =>
  typeof source === "string" ? source : source.uri;

export const createSoundBank = ({
  maxVoices = 6,
}: SoundBankOptions = {}): SoundBank => {
  const voiceLimit = Number.isFinite(maxVoices)
    ? Math.max(1, Math.floor(maxVoices))
    : 6;

  const context = new AudioContext({ latencyHint: "interactive" });
  const clips = new Map<string, Clip>();
  const active: Voice[] = [];
  let disposed = false;

  const removeVoice = (voice: Voice) => {
    const index = active.indexOf(voice);
    if (index !== -1) {
      active.splice(index, 1);
    }

    voice.source.onended = null;
    voice.source.disconnect();
    voice.gain.disconnect();
  };

  const stopVoice = (voice: Voice) => {
    removeVoice(voice);
    try {
      voice.source.stop();
    } catch {
      // A source can finish between the caller's lookup and stop().
    }
  };

  const decode = (clip: Clip) => {
    if (clip.buffer) {
      return Promise.resolve(clip.buffer);
    }

    clip.loading ??= context
      .decodeAudioData(uriFor(clip.source))
      .then((buffer) => {
        clip.buffer = buffer;
        return buffer;
      })
      .finally(() => {
        clip.loading = undefined;
      });

    return clip.loading;
  };

  return {
    capabilities: (): SoundCapabilities => ({
      supported: true,
      userGestureRequired: false,
      maxVoices: voiceLimit,
    }),
    load: async (name, source) => {
      if (disposed) {
        throw new Error("SoundBank is disposed");
      }

      for (let index = active.length - 1; index >= 0; index--) {
        const voice = active[index];
        if (voice?.name === name) {
          stopVoice(voice);
        }
      }

      const clip: Clip = { source };
      clips.set(name, clip);
      await decode(clip);
    },
    play: async (name, { volume = 1 } = {}) => {
      const clip = clips.get(name);
      if (!clip || disposed) {
        return false;
      }

      try {
        const buffer = await decode(clip);
        if (disposed || clips.get(name) !== clip) {
          return false;
        }

        await context.resume();
        while (active.length >= voiceLimit) {
          const oldest = active[0];
          if (oldest) {
            stopVoice(oldest);
          }
        }

        const source = context.createBufferSource();

        const gain = context.createGain({
          gain: Number.isFinite(volume) ? Math.max(0, Math.min(1, volume)) : 1,
        });

        source.buffer = buffer;
        source.connect(gain);
        gain.connect(context.destination);
        const voice: Voice = { source, gain, name };
        source.onended = () => removeVoice(voice);
        active.push(voice);
        source.start();
        return true;
      } catch {
        return false;
      }
    },
    stop: (name) => {
      for (let index = active.length - 1; index >= 0; index--) {
        const voice = active[index];
        if (voice && (name === undefined || voice.name === name)) {
          stopVoice(voice);
        }
      }
    },
    dispose: () => {
      if (disposed) {
        return;
      }

      disposed = true;
      for (const voice of active.splice(0)) {
        stopVoice(voice);
      }

      clips.clear();
      void context.close();
    },
  };
};
