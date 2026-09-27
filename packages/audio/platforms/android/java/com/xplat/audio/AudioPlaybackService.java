package com.xplat.audio;

import android.content.Intent;
import android.net.Uri;
import java.io.File;
import android.os.IBinder;
import android.util.Log;

import androidx.media3.common.AudioAttributes;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MediaMetadata;
import androidx.media3.common.PlaybackException;
import androidx.media3.common.Player;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.session.MediaSession;
import androidx.media3.session.MediaSessionService;

import org.json.JSONArray;
import org.json.JSONObject;

public final class AudioPlaybackService extends MediaSessionService {
	private static final String TAG = "XplatAudio";
	private ExoPlayer player;
	private MediaSession session;
	private Player.Listener listener;
	private String error;

	@Override public void onCreate() {
		super.onCreate();
		player = new ExoPlayer.Builder(this).build();
		player.setAudioAttributes(AudioAttributes.DEFAULT, true);
		listener = new Player.Listener() {
			@Override public void onEvents(Player p, Player.Events events) { publishSnapshot(); }
			@Override public void onPlayerError(PlaybackException exception) {
				error = exception.getMessage();
				publishSnapshot();
			}
		};
		player.addListener(listener);
		session = new MediaSession.Builder(this, player).build();
		publishSnapshot();
	}

	@Override public MediaSession onGetSession(MediaSession.ControllerInfo controllerInfo) { return session; }

	@Override public int onStartCommand(Intent intent, int flags, int startId) {
		int result = super.onStartCommand(intent, flags, startId);
		if (intent == null || intent.getAction() == null) return result;
		try {
			switch (intent.getAction()) {
				case AudioBridge.ACTION_QUEUE:
					setQueue(intent.getStringExtra("queue"), intent.getIntExtra("index", 0));
					break;
				case AudioBridge.ACTION_PLAY: player.play(); break;
				case AudioBridge.ACTION_PAUSE: player.pause(); break;
				case AudioBridge.ACTION_SEEK: player.seekTo((long) (intent.getDoubleExtra("seconds", 0) * 1000)); break;
				case AudioBridge.ACTION_RELEASE:
					player.stop();
					player.clearMediaItems();
					stopSelf();
					break;
			}
		} catch (Exception cause) {
			Log.e(TAG, "Audio command failed", cause);
			error = cause.getMessage();
			publishSnapshot();
		}
		return result;
	}

	private void setQueue(String encoded, int startAt) throws Exception {
		JSONArray queue = new JSONArray(encoded == null ? "[]" : encoded);
		player.clearMediaItems();
		error = null;
		for (int i = 0; i < queue.length(); i++) {
			JSONObject track = queue.getJSONObject(i);
			String source = track.getString("source");
			MediaMetadata metadata = new MediaMetadata.Builder()
				.setTitle(track.optString("title", track.optString("id", "")))
				.setArtist(track.optString("artist", ""))
				.setAlbumTitle(track.optString("album", ""))
				.build();
			Uri uri = source.startsWith("/") ? Uri.fromFile(new File(source)) : Uri.parse(source);
			player.addMediaItem(new MediaItem.Builder().setUri(uri).setMediaMetadata(metadata).build());
		}
		if (queue.length() > 0) player.seekTo(Math.max(0, Math.min(startAt, queue.length() - 1)), 0);
		player.prepare();
		publishSnapshot();
	}

	private void publishSnapshot() {
		try {
			JSONObject value = new JSONObject();
			int index = player == null ? -1 : player.getCurrentMediaItemIndex();
			value.put("state", error != null ? "error" : player == null || player.getMediaItemCount() == 0 ? "idle" : player.getPlaybackState() == Player.STATE_ENDED ? "ended" : player.isPlaying() ? "playing" : player.getPlaybackState() == Player.STATE_BUFFERING ? "loading" : "paused");
			value.put("index", index);
			value.put("currentTime", player == null ? 0 : Math.max(0, player.getCurrentPosition()) / 1000.0);
			value.put("duration", player == null || player.getDuration() < 0 ? 0 : player.getDuration() / 1000.0);
			if (error != null) value.put("error", error);
			AudioBridge.publish(value.toString());
		} catch (Exception ignored) { }
	}

	@Override public void onDestroy() {
		if (player != null) {
			player.removeListener(listener);
			player.release();
		}
		if (session != null) session.release();
		AudioBridge.publish("{\"state\":\"idle\",\"currentTime\":0,\"duration\":0}");
		super.onDestroy();
	}

	@Override public IBinder onBind(Intent intent) { return super.onBind(intent); }
}
