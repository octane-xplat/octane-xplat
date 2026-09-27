package com.xplat.audio;

import android.content.Context;
import android.content.Intent;

/** Commands cross the JS/service boundary as intents so they remain ordered. */
public final class AudioBridge {
	public static final String ACTION_QUEUE = "com.xplat.audio.QUEUE";
	public static final String ACTION_PLAY = "com.xplat.audio.PLAY";
	public static final String ACTION_PAUSE = "com.xplat.audio.PAUSE";
	public static final String ACTION_SEEK = "com.xplat.audio.SEEK";
	public static final String ACTION_RELEASE = "com.xplat.audio.RELEASE";
	private static volatile String snapshot = "{\"state\":\"idle\",\"currentTime\":0,\"duration\":0}";

	private AudioBridge() {}

	public static void dispatch(Context context, String action, String payload, int index, double seconds) {
		Intent intent = new Intent(context.getApplicationContext(), AudioPlaybackService.class);
		intent.setAction(action);
		if (payload != null) intent.putExtra("queue", payload);
		intent.putExtra("index", index);
		intent.putExtra("seconds", seconds);
		context.getApplicationContext().startService(intent);
	}

	public static void publish(String value) { snapshot = value; }
	public static String snapshot() { return snapshot; }
}
