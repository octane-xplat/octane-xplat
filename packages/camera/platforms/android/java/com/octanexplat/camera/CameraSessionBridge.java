package com.octanexplat.camera;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.media.MediaExtractor;
import android.media.MediaFormat;
import android.media.MediaMetadataRetriever;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.util.Size;
import android.view.Surface;
import androidx.camera.camera2.interop.Camera2CameraInfo;
import androidx.camera.core.Camera;
import androidx.camera.core.CameraInfo;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.CameraState;
import androidx.camera.core.DynamicRange;
import androidx.camera.core.MirrorMode;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.video.FileOutputOptions;
import androidx.camera.video.PendingRecording;
import androidx.camera.video.Quality;
import androidx.camera.video.QualitySelector;
import androidx.camera.video.Recorder;
import androidx.camera.video.Recording;
import androidx.camera.video.VideoCapture;
import androidx.camera.video.VideoRecordEvent;
import androidx.core.content.ContextCompat;
import androidx.lifecycle.Lifecycle;
import androidx.lifecycle.LifecycleOwner;
import androidx.lifecycle.LifecycleRegistry;
import com.google.common.util.concurrent.ListenableFuture;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.util.Collections;
import java.util.UUID;
import org.json.JSONArray;
import org.json.JSONObject;

/** CameraX is bound to this owner, not the preview's window lifetime. */
public final class CameraSessionBridge implements LifecycleOwner {
	public interface Listener { void event(String type, String payload); }
	private final Context context;
	private final LifecycleRegistry lifecycle = new LifecycleRegistry(this);
	private final Handler handler = new Handler(Looper.getMainLooper());
	private Listener listener;
	private ProcessCameraProvider provider;
	private Preview preview;
	private VideoCapture<Recorder> video;
	private Camera camera;
	private CameraPreviewView host;
	private CameraPreviewView observedHost;
	private Recording recording;
	private File staging;
	private File destination;
	private boolean detached;
	private boolean released;
	private boolean backgrounded;
	private boolean resumeAfterFinalization;
	private boolean ownsDestination;
	private boolean ready;
	private boolean started;
	private boolean finalizing;
	private final java.util.concurrent.ExecutorService finalizer = java.util.concurrent.Executors.newSingleThreadExecutor();
	private boolean audioRequested;
	private long elapsed;
	private volatile double sourceFrameRate;
	private long lastFrameTime;
	private long takeGeneration;
	private volatile int generation;
	private Runnable watchdog;
	private Runnable startWatchdog;
	private String selection = "default";
	private String cameraId = "";
	private String facing;
	private int rotation;

	public CameraSessionBridge(Context context, Listener listener) {
		this.context = context.getApplicationContext();
		this.listener = listener;
		lifecycle.handleLifecycleEvent(Lifecycle.Event.ON_CREATE);
	}
	@Override public Lifecycle getLifecycle() { return lifecycle; }
	private void emit(String type, String value) { if (listener != null) listener.event(type, value); }
	private void ready(boolean value) { ready = value; emit("ready", Boolean.toString(value)); }
	public boolean isReady() { return ready && sourceFrameRate > 0 && !detached && !released; }
	public long elapsedMs() { return elapsed; }
	private void failure(String stage, String kind, String message) {
		try { emit("failed", new JSONObject().put("stage", stage).put("kind", kind).put("message", message).toString()); }
		catch (Exception ignored) { emit("failed", "{\"stage\":\"capture\",\"kind\":\"captureFailed\",\"message\":\"Camera failure\"}"); }
	}

	public void attach(CameraPreviewView view, String selected) {
		if (host == view && !detached && preview != null && selection.equals(selected)) return;
		if (recording != null || released) throw new IllegalStateException("Camera is finalizing or disposed");
		unbind();
		host = view;
		detached = false;
		selection = selected;
		final int epoch = ++generation;
		lifecycle.handleLifecycleEvent(Lifecycle.Event.ON_START);
		ListenableFuture<ProcessCameraProvider> future = ProcessCameraProvider.getInstance(context);
		future.addListener(() -> {
			if (released || detached || epoch != generation) return;
			try {
				provider = future.get();
				CameraSelector selector = selectCamera(selected);
				CameraInfo info = provider.getAvailableCameraInfos().stream().filter(i -> selector.filter(Collections.singletonList(i)).size() > 0).findFirst().orElseThrow(() -> new IllegalArgumentException("Selected camera unavailable"));
				cameraId = Camera2CameraInfo.from(info).getCameraId();
				Integer lens = info.getLensFacing();
				facing = lens != null && lens == CameraSelector.LENS_FACING_FRONT ? "front" : lens != null && lens == CameraSelector.LENS_FACING_BACK ? "back" : null;
				java.util.List<Quality> qualities = Recorder.getVideoCapabilities(info).getSupportedQualities(DynamicRange.SDR);
				if (qualities.isEmpty()) throw new IllegalArgumentException("No SDR recording profile");
				Quality quality = qualities.contains(Quality.HD) ? Quality.HD : qualities.get(0);
				Recorder recorder = new Recorder.Builder().setQualitySelector(QualitySelector.from(quality)).build();
				rotation = view.getDisplay() == null ? Surface.ROTATION_0 : view.getDisplay().getRotation();
				video = new VideoCapture.Builder<>(recorder).setMirrorMode(MirrorMode.MIRROR_MODE_OFF).setTargetRotation(rotation).setTargetFrameRate(new android.util.Range<>(30, 30)).build();
				Preview.Builder previewBuilder = new Preview.Builder().setTargetRotation(rotation);
				sourceFrameRate = 0; lastFrameTime = 0;
				new androidx.camera.camera2.interop.Camera2Interop.Extender<>(previewBuilder).setSessionCaptureCallback(new android.hardware.camera2.CameraCaptureSession.CaptureCallback() {
					@Override public void onCaptureCompleted(android.hardware.camera2.CameraCaptureSession session, android.hardware.camera2.CaptureRequest request, android.hardware.camera2.TotalCaptureResult result) {
						if (released || epoch != generation) return;
						Long timestamp = result.get(android.hardware.camera2.CaptureResult.SENSOR_TIMESTAMP);
						if (timestamp != null && timestamp > lastFrameTime) {
							if (lastFrameTime > 0) sourceFrameRate = 1_000_000_000.0 / (timestamp - lastFrameTime);
							lastFrameTime = timestamp;
						}
					}
				});
				preview = previewBuilder.build();
				preview.setSurfaceProvider(view.getSurfaceProvider());
				camera = provider.bindToLifecycle(this, selector, preview, video);
				camera.getCameraInfo().getCameraState().observe(this, state -> {
					if (released || epoch != generation) return;
					if (state.getError() != null || state.getType() == CameraState.Type.CLOSED) {
						ready(false);
						emit("availability", "false");
						if (recording != null) { emit("interruption", "cameraInUse"); stop(); }
					}
				});
				observedHost = view;
				view.getStreamState().observe(this, state -> {
					if (host != view || detached || released || epoch != generation) return;
					boolean streaming = state == androidx.camera.view.PreviewView.StreamState.STREAMING;
					ready(streaming);
					if (streaming) { emit("availability", "true"); emit("recovered", "unknown"); }
				});
			} catch (Exception cause) { ready(false); emit("previewError", cause.toString()); unbind(); }
		}, ContextCompat.getMainExecutor(context));
	}
	private CameraSelector selectCamera(String selected) throws androidx.camera.core.CameraInfoUnavailableException {
		if (selected.startsWith("id:")) return new CameraSelector.Builder().addCameraFilter(infos -> {
			java.util.List<CameraInfo> found = new java.util.ArrayList<>();
			for (CameraInfo info : infos) if (Camera2CameraInfo.from(info).getCameraId().equals(selected.substring(3))) found.add(info);
			return found;
		}).build();
		if ("front".equals(selected)) return CameraSelector.DEFAULT_FRONT_CAMERA;
		if ("back".equals(selected)) return CameraSelector.DEFAULT_BACK_CAMERA;
		return provider.hasCamera(CameraSelector.DEFAULT_BACK_CAMERA) ? CameraSelector.DEFAULT_BACK_CAMERA : new CameraSelector.Builder().build();
	}
	public void detach() {
		detached = true;
		generation++;
		host = null;
		ready(false);
		if (recording == null) unbind();
	}
	public void background() { backgrounded = true; resumeAfterFinalization = false; ready(false); emit("interruption", "background"); if (recording != null) stop(); else unbind(); }
	public void foreground() { backgrounded = false; emit("recovered", "background"); if (recording != null) { resumeAfterFinalization = true; } else if (host != null && !detached) { unbind(); attach(host, selection); } }
	private void unbind() {
		if (camera != null) camera.getCameraInfo().getCameraState().removeObservers(this);
		if (observedHost != null) { observedHost.getStreamState().removeObservers(this); observedHost = null; }
		if (provider != null) {
			if (preview != null) provider.unbind(preview);
			if (video != null) provider.unbind(video);
		}
		preview = null; video = null; camera = null;
		if (lifecycle.getCurrentState().isAtLeast(Lifecycle.State.STARTED)) lifecycle.handleLifecycleEvent(Lifecycle.Event.ON_STOP);
	}
	public void release() { released = true; generation++; host = null; unbind(); lifecycle.handleLifecycleEvent(Lifecycle.Event.ON_DESTROY); listener = null; finalizer.shutdown(); }

	public String capabilities() {
		try {
			JSONObject result = new JSONObject();
			JSONArray cameras = new JSONArray();
			if (provider != null) for (CameraInfo info : provider.getAvailableCameraInfos()) {
				JSONObject device = new JSONObject().put("id", Camera2CameraInfo.from(info).getCameraId()).put("label", "Camera " + Camera2CameraInfo.from(info).getCameraId());
				Integer lens = info.getLensFacing();
				if (lens != null && lens == CameraSelector.LENS_FACING_FRONT) device.put("facing", "front");
				if (lens != null && lens == CameraSelector.LENS_FACING_BACK) device.put("facing", "back");
				cameras.put(device);
			}
			JSONArray profiles = new JSONArray();
			if (video != null && video.getResolutionInfo() != null && sourceFrameRate > 0) {
				Size size = video.getResolutionInfo().getResolution();
				profiles.put(new JSONObject().put("profile", "standard").put("width", size.getWidth()).put("height", size.getHeight()).put("frameRate", Math.round(sourceFrameRate * 100.0) / 100.0));
			}
			return result.put("cameras", cameras).put("profiles", profiles).toString();
		} catch (Exception cause) { return "{\"cameras\":[],\"profiles\":[]}"; }
	}
	private String orientation() {
		// Display rotation is not a cardinal camera orientation on every device.
		return "unspecified";
	}
	public void start(boolean audio, String destinationPath, long maximumDurationMs) {
		if (!isReady() || video == null) { failure("preparation", "unavailable", "Preview source is inactive"); return; }
		if (audio && ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) { failure("preparation", "permissionDenied", "Requested microphone permission is missing"); return; }
		audioRequested = audio; elapsed = 0; started = false;
		final long take = ++takeGeneration;
		rotation = host.getDisplay() == null ? Surface.ROTATION_0 : host.getDisplay().getRotation();
		video.setTargetRotation(rotation);
		try {
			File directory = new File(context.getFilesDir(), "octane-camera");
			if (!directory.isDirectory() && !directory.mkdirs()) throw new java.io.IOException("Cannot create private movie storage");
			destination = destinationPath == null || destinationPath.isEmpty() ? new File(directory, UUID.randomUUID() + ".mp4") : new File(destinationPath);
			if (!destination.getName().endsWith(".mp4") || !destination.isAbsolute()) { destination = null; failure("preparation", "destinationUnavailable", "Destination must be an absolute .mp4 file"); return; }
			String path = destination.getCanonicalPath();
			File cache = context.getCacheDir();
			File externalCache = context.getExternalCacheDir();
			if (path.startsWith(cache.getCanonicalPath() + File.separator) || externalCache != null && path.startsWith(externalCache.getCanonicalPath() + File.separator)) {
				destination = null; failure("preparation", "destinationUnavailable", "Cache paths do not provide durable movie storage"); return;
			}
			if (!destination.createNewFile()) { destination = null; failure("preparation", "destinationUnavailable", "Destination already exists"); return; }
			ownsDestination = true;
			staging = new File(directory, UUID.randomUUID() + ".recording.mp4");
			FileOutputOptions.Builder options = new FileOutputOptions.Builder(staging);
			if (maximumDurationMs > 0) options.setDurationLimitMillis(maximumDurationMs);
			PendingRecording pending = video.getOutput().prepareRecording(context, options.build());
			if (audio) pending = pending.withAudioEnabled();
			recording = pending.start(ContextCompat.getMainExecutor(context), event -> {
				if (take != takeGeneration || recording == null) return;
				elapsed = event.getRecordingStats().getRecordedDurationNanos() / 1_000_000;
				if (event instanceof VideoRecordEvent.Start) {
					started = true;
					if (startWatchdog != null) handler.removeCallbacks(startWatchdog);
					try {
						Size size = video.getResolutionInfo().getResolution();
						JSONObject effective = new JSONObject().put("cameraId", cameraId).put("audio", audio).put("width", size.getWidth()).put("height", size.getHeight()).put("frameRate", Math.round(sourceFrameRate * 100.0) / 100.0).put("orientation", orientation()).put("mimeType", "video/mp4").put("container", "mp4");
						if (facing != null) effective.put("facing", facing);
						emit("started", effective.toString());
					} catch (Exception cause) { stop(); }
				} else if (event instanceof VideoRecordEvent.Finalize) finish((VideoRecordEvent.Finalize) event);
			});
			startWatchdog = () -> { if (!started && recording != null) stop(); };
			handler.postDelayed(startWatchdog, 15_000);
		} catch (Exception cause) {
			String kind = cause.toString().contains("ENOSPC") ? "insufficientStorage" : cause instanceof java.io.IOException || cause instanceof SecurityException && !ownsDestination ? "destinationUnavailable" : "captureFailed";
			cleanup(); failure("preparation", kind, cause.toString());
		}
	}
	public void stop() {
		if (recording == null || watchdog != null || finalizing) return;
		try { recording.stop(); } catch (Exception cause) { cleanup(); failure("capture", "captureFailed", cause.toString()); return; }
		// A lost native terminal callback cannot leave completion dangling.
		watchdog = () -> { if (recording != null) { recording.close(); cleanup(); failure("finalization", "finalizationFailed", "CameraX finalization timed out"); if (detached || released || backgrounded) unbind(); } };
		handler.postDelayed(watchdog, 30_000);
	}
	private void finish(VideoRecordEvent.Finalize event) {
		if (recording == null || finalizing) return;
		finalizing = true;
		if (watchdog != null) handler.removeCallbacks(watchdog);
		if (startWatchdog != null) handler.removeCallbacks(startWatchdog);
		watchdog = null; startWatchdog = null;
		int nativeError = event.getError();

		if (nativeError == VideoRecordEvent.Finalize.ERROR_SOURCE_INACTIVE) emit("interruption", "unknown");
		emit("finishing", nativeError == VideoRecordEvent.Finalize.ERROR_DURATION_LIMIT_REACHED ? "maximumDuration" : nativeError == VideoRecordEvent.Finalize.ERROR_SOURCE_INACTIVE ? "interrupted" : nativeError == VideoRecordEvent.Finalize.ERROR_NONE ? "" : "captureError");
		finalizer.execute(() -> finalizeFile(nativeError));
	}
	private void finalizeFile(int nativeError) {
		String stage = "finalization";
		try {
			if (!started) throw new java.io.IOException("No capture start was observed");
			inspect(staging, audioRequested);
			stage = "storage";
			// Sync the finalized media, then commit to our exclusively reserved file.
			try (FileInputStream input = new FileInputStream(staging); FileOutputStream output = new FileOutputStream(destination)) {
				byte[] buffer = new byte[65536]; int count;
				while ((count = input.read(buffer)) != -1) output.write(buffer, 0, count);
				output.getFD().sync();
			}
			JSONObject committed = inspect(destination, audioRequested);
			if (destination.length() != staging.length()) throw new java.io.IOException("Committed file size mismatch");
			String url = Uri.fromFile(destination).toString();
			committed.put("output", new JSONObject().put("kind", "nativeFile").put("resourceId", url).put("fileUrl", url));
			committed.put("kind", "clip").put("limitReached", nativeError == VideoRecordEvent.Finalize.ERROR_DURATION_LIMIT_REACHED);
			if (nativeError != VideoRecordEvent.Finalize.ERROR_NONE && nativeError != VideoRecordEvent.Finalize.ERROR_DURATION_LIMIT_REACHED) {
				committed.put("endReason", nativeError == VideoRecordEvent.Finalize.ERROR_SOURCE_INACTIVE ? "interrupted" : "captureError");
				committed.put("warning", new JSONObject().put("kind", "captureFailed").put("operation", "capture").put("message", "CameraX finalized with error " + nativeError));
			}
			final String result = committed.toString();
			handler.post(() -> {
				staging.delete(); staging = null; destination = null; ownsDestination = false; recording = null; finalizing = false;
				if (detached || released || backgrounded) unbind();
				emit("finished", result);
				resumePreviewIfNeeded();
			});
		} catch (Exception cause) {
			final boolean noMedia = staging == null || !staging.isFile() || staging.length() == 0 || !started;
			final String failedStage = nativeError == VideoRecordEvent.Finalize.ERROR_INSUFFICIENT_STORAGE ? "storage" : stage;
			final String kind = noMedia ? "noMedia" : nativeError == VideoRecordEvent.Finalize.ERROR_INSUFFICIENT_STORAGE ? "insufficientStorage" : "storage".equals(stage) ? "storageFailed" : cause.getMessage() != null && cause.getMessage().contains("Requested audio") ? "captureFailed" : "finalizationFailed";
			handler.post(() -> {
				cleanup();
				if (detached || released || backgrounded) unbind();
				failure(failedStage, kind, cause.toString());
				resumePreviewIfNeeded();
			});
		}
	}
	private void resumePreviewIfNeeded() {
		if (resumeAfterFinalization && host != null && !detached && !released) { resumeAfterFinalization = false; unbind(); attach(host, selection); }
	}
	private void cleanup() {
		finalizing = false;
		if (watchdog != null) handler.removeCallbacks(watchdog);
		if (startWatchdog != null) handler.removeCallbacks(startWatchdog);
		watchdog = null; startWatchdog = null; recording = null; takeGeneration++;
		if (staging != null) staging.delete();
		if (destination != null && ownsDestination) destination.delete();
		ownsDestination = false;
		staging = null; destination = null;
	}
	private static JSONObject inspect(File file, boolean audioRequested) throws Exception {
		if (file == null || !file.isFile() || file.length() == 0) throw new java.io.IOException("No finalized movie");
		MediaMetadataRetriever retriever = new MediaMetadataRetriever();
		MediaExtractor extractor = new MediaExtractor();
		try {
			retriever.setDataSource(file.getAbsolutePath());
			extractor.setDataSource(file.getAbsolutePath());
			String containerMime = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_MIMETYPE);
			if (!"video/mp4".equals(containerMime)) throw new java.io.IOException("Finalized movie is not the advertised MP4 container: " + containerMime);
			long duration = Long.parseLong(retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION));
			int width = Integer.parseInt(retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH));
			int height = Integer.parseInt(retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT));
			String rawRotation = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION);
			int rotation = rawRotation == null ? 0 : Integer.parseInt(rawRotation);
			if (rotation == 90 || rotation == 270) { int swap = width; width = height; height = swap; }
			boolean hasVideo = false, hasAudio = false;
			for (int i = 0; i < extractor.getTrackCount(); i++) {
				MediaFormat format = extractor.getTrackFormat(i);
				String mime = format.getString(MediaFormat.KEY_MIME);
				extractor.selectTrack(i);
				boolean samples = extractor.getSampleTime() >= 0;
				extractor.unselectTrack(i);
				if (samples && mime != null && mime.startsWith("video/")) hasVideo = true;
				if (samples && mime != null && mime.startsWith("audio/")) hasAudio = true;
			}
			if (!hasVideo || duration <= 0 || width <= 0 || height <= 0) throw new java.io.IOException("Movie has no usable video");
			if (audioRequested && !hasAudio) throw new java.io.IOException("Requested audio is absent");
			return new JSONObject().put("mimeType", containerMime).put("durationMs", duration).put("width", width).put("height", height).put("orientation", "unspecified").put("hasAudio", hasAudio);
		} finally { retriever.release(); extractor.release(); }
	}
	public static String openOutput(String resourceId, String fileUrl) throws Exception {
		if (!resourceId.equals(fileUrl) || !"file".equals(Uri.parse(fileUrl).getScheme())) throw new IllegalArgumentException("Expected matching native file references");
		File file = new File(Uri.parse(fileUrl).getPath());
		inspect(file, false);
		return Uri.fromFile(file).toString();
	}
}
