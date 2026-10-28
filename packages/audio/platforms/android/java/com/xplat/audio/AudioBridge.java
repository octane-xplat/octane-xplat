package com.xplat.audio;

import android.content.Context;
import android.content.Intent;
import android.util.Log;

/** Commands cross the JS/service boundary as intents so they remain ordered. */
public final class AudioBridge {
	public static final String ACTION_UPDATE = "com.xplat.audio.UPDATE";
	public static final String ACTION_QUEUE = "com.xplat.audio.QUEUE";
	public static final String ACTION_RATE = "com.xplat.audio.RATE";
	public static final String ACTION_VOLUME = "com.xplat.audio.VOLUME";
	public static final String ACTION_MUTED = "com.xplat.audio.MUTED";
	public static final String ACTION_PLAY = "com.xplat.audio.PLAY";
	public static final String ACTION_PAUSE = "com.xplat.audio.PAUSE";
	public static final String ACTION_SEEK = "com.xplat.audio.SEEK";
	public static final String ACTION_RELEASE = "com.xplat.audio.RELEASE";
	private static final String TAG = "XplatAudio";
	// The service is exported for the Media3 session — command intents are
	// accepted only when they carry this process-local token, which a foreign
	// app cannot observe or forge.
	private static final String COMMAND_TOKEN = java.util.UUID.randomUUID().toString();
	private static volatile String snapshot = "{\"state\":\"idle\",\"currentTime\":0,\"duration\":0}";
	private static final java.util.concurrent.ConcurrentHashMap<String, String> pendingQueues = new java.util.concurrent.ConcurrentHashMap<>();

	private AudioBridge() {}

	public static void dispatch(Context context, String action, String payload, int index, double seconds) {
		Intent intent = new Intent(context.getApplicationContext(), AudioPlaybackService.class);
		intent.setAction(action);
		intent.putExtra("commandToken", COMMAND_TOKEN);
		// The queue JSON can exceed the ~1MB Binder extra limit — hand it to
		// the service in-process and keep the intent small.
		String queueKey = null;
		if (payload != null && (ACTION_QUEUE.equals(action) || ACTION_UPDATE.equals(action))) {
			queueKey = java.util.UUID.randomUUID().toString();
			pendingQueues.put(queueKey, payload);
			intent.putExtra("queueKey", queueKey);
		}
		intent.putExtra("index", index);
		intent.putExtra("seconds", seconds);
		try {
			context.getApplicationContext().startService(intent);
		} catch (RuntimeException failure) {
			// A JS-initiated command while the app is backgrounded throws
			// IllegalStateException — surface it through snapshot.error and
			// rethrow so the caller's promise rejects.
			if (queueKey != null) pendingQueues.remove(queueKey);
			Log.e(TAG, "Audio command dispatch failed", failure);
			publish("{\"state\":\"error\",\"currentTime\":0,\"duration\":0,\"error\":\"audio command dispatch failed\"}");
			throw failure;
		}
	}

	static boolean isCommandIntent(Intent intent) {
		return intent != null && COMMAND_TOKEN.equals(intent.getStringExtra("commandToken"));
	}

	static String takeQueue(Intent intent) {
		String key = intent.getStringExtra("queueKey");
		return key == null ? null : pendingQueues.remove(key);
	}

	public static void publish(String value) { snapshot = value; }
	public static String snapshot() { AudioPlaybackService.refreshSnapshot(); return snapshot; }
}
