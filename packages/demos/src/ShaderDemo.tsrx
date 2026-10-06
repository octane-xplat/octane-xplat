import { Canvas } from '@octane-xplat/canvas';
import { Heading, HStack, Pressable, Text, View } from '@octane-xplat/ui';
import { useEffect, useRef, useState } from 'octane';
import { applyMotionPreference, mountShader } from './shader-noise';
import type { ShaderMount } from './shader-noise';
import type { ShaderInstance } from '@octane-xplat/shaders';

/** Shared `shaders` adapter demo — the published upstream engine runs a
 *  SimplexNoise preset on an Xplat Canvas (browser WebGPU on web;
 *  wgpu-over-Metal/Vulkan on native, experimental). The dark View behind
 *  the canvas is the static fallback: visible while mounting and retained
 *  on any terminal failure. Foreground controls are ordinary Xplat UI. */
export function ShaderDemo() @{
	const [status, setStatus] = useState('mounting…');
	const [paused, setPaused] = useState(false);
	const shader = useRef<ShaderInstance | null>(null);
	const mount = useRef<ShaderMount | null>(null);

	useEffect(() => {
		return () => {
			// Unmount: cancel a still-running init, then dispose the instance.
			mount.current?.signal.abort();
			shader.current?.destroy();
			shader.current = null;
			mount.current = null;
		};
	}, []);

	const onReady = ({ canvas }: { canvas: unknown }) => {
		const pending = mountShader(canvas, {
			onReady: () => setStatus('rendering'),
			onError: (reason) => {
				setStatus('static fallback — ' + reason);
			},
		});

		mount.current = pending;
		pending.instance
			.then((instance) => {
				if (pending.signal.aborted) return;
				shader.current = instance;
				if (applyMotionPreference(instance)) {
					setPaused(true);
					setStatus('still frame (reduced motion)');
				}
			})
			.catch(() => {
				if (!pending.signal.aborted) setStatus('static fallback — init-failed');
			});
	};

	const togglePause = () => {
		const instance = shader.current;
		if (!instance) return;
		if (paused) {
			instance.resume();
			setPaused(false);
		} else {
			instance.pause();
			setPaused(true);
		}
	};

	const recolor = () => {
		shader.current?.update('background', {
			colorB: '#f97316',
			seed: Math.floor(Math.random() * 1000),
			speed: 1.2,
		});
	};

	<View className="vx-app flex-1 gap-4">
		<Heading level={2}>Shader / SimplexNoise</Heading>
		<Text>
			The published shaders engine drives this canvas — same upstream
			preset, update/pause/resume/destroy semantics, telemetry off by
			default. The box behind it is plain Xplat layout, still standing if
			WebGPU is unavailable or the GPU is lost.
		</Text>
		<View style={{ width: 320, height: 180, backgroundColor: '#0f172a' }}>
			<Canvas
				id="shader-canvas"
				width={320}
				height={180}
				style={{ width: 320, height: 180 }}
				onReady={onReady}
			/>
		</View>
		<HStack className="gap-4">
			<Pressable id="shader-toggle" onPress={togglePause} className="btn bg-primary">
				<Text className="text-onprimary">{paused ? 'Resume' : 'Pause'}</Text>
			</Pressable>
			<Pressable id="shader-recolor" onPress={recolor} className="btn btn-secondary">
				<Text>Recolor + speed up</Text>
			</Pressable>
		</HStack>
		<Text id="shader-status">{status}</Text>
	</View>;
}
