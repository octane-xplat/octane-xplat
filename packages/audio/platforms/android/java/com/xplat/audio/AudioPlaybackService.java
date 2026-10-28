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
	private static AudioPlaybackService active;
	private ExoPlayer player;
	private MediaSession session;
	private Player.Listener listener;
	private String error;
	private float volume = 1;
	private boolean muted;
	private boolean queueComplete = true;

	@Override public void onCreate() {
		super.onCreate();
		active = this;
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
		// com.xplat.audio.* commands execute only for this app's in-process
		// bridge — the exported service is reachable by any installed app, so
		// foreign command intents without the process token are dropped.
		if (intent.getAction().startsWith("com.xplat.audio.") && !AudioBridge.isCommandIntent(intent)) {
			return result;
		}

		try {
			switch (intent.getAction()) {
				case AudioBridge.ACTION_QUEUE:
					setQueue(AudioBridge.takeQueue(intent), intent.getIntExtra("index", 0), false);
					break;
				case AudioBridge.ACTION_UPDATE:
					setQueue(AudioBridge.takeQueue(intent), 0, true);
					break;
				case AudioBridge.ACTION_RATE:
					player.setPlaybackParameters(new androidx.media3.common.PlaybackParameters((float) intent.getDoubleExtra("seconds", 1), 1));
					break;
				case AudioBridge.ACTION_VOLUME:
					volume = (float) intent.getDoubleExtra("seconds", 1);
					player.setVolume(muted ? 0 : volume);
					break;
				case AudioBridge.ACTION_MUTED:
					muted = intent.getDoubleExtra("seconds", 0) != 0;
					player.setVolume(muted ? 0 : volume);
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

	private void setQueue(String encoded, int startAt, boolean update) throws Exception {
		if (encoded == null) throw new IllegalStateException("Missing audio queue command");
		JSONObject payload = new JSONObject(encoded);
		JSONArray queue = payload.getJSONArray("tracks");
		java.util.List<MediaItem> items = new java.util.ArrayList<>();
		for (int i = 0; i < queue.length(); i++) {
			JSONObject track = queue.getJSONObject(i);
			String source = track.getString("source");
			MediaMetadata metadata = new MediaMetadata.Builder()
				.setTitle(track.optString("title", track.getString("id")))
				.setArtist(track.optString("artist", ""))
				.setAlbumTitle(track.optString("album", ""))
				.build();
			Uri uri = source.startsWith("/") ? Uri.fromFile(new File(source)) : Uri.parse(source);
			items.add(new MediaItem.Builder().setMediaId(track.getString("id")).setUri(uri).setMediaMetadata(metadata).build());
		}
		MediaItem current = player.getCurrentMediaItem();
		int retained = -1;
		if (update && current != null) {
			for (int i = 0; i < items.size(); i++) {
				MediaItem item = items.get(i);
				if (item.mediaId.equals(current.mediaId) && item.localConfiguration.uri.equals(current.localConfiguration.uri)) retained = i;
			}
		}
		boolean waiting = !queueComplete && player.getPlaybackState() == Player.STATE_ENDED;
		queueComplete = payload.optBoolean("complete", true);
		error = null;
		if (retained >= 0) {
			// Edit around the current native MediaItem; never replace its source.
			int oldIndex = player.getCurrentMediaItemIndex();
			player.removeMediaItems(oldIndex + 1, player.getMediaItemCount());
			player.removeMediaItems(0, oldIndex);
			player.addMediaItems(0, items.subList(0, retained));
			player.addMediaItems(items.subList(retained + 1, items.size()));
			player.replaceMediaItem(retained, current.buildUpon().setMediaMetadata(items.get(retained).mediaMetadata).build());
			if (waiting && player.getPlayWhenReady() && retained + 1 < items.size()) {
				player.seekTo(retained + 1, 0);
				player.prepare();
			}
		} else {
			player.pause();
			player.setMediaItems(items, items.isEmpty() ? 0 : Math.max(0, Math.min(startAt, items.size() - 1)), 0);
			player.prepare();
		}
		publishSnapshot();
	}

	static void refreshSnapshot() {
		AudioPlaybackService service = active;
		if (service != null && android.os.Looper.myLooper() == android.os.Looper.getMainLooper()) service.publishSnapshot();
	}

	private void publishSnapshot() {
		try {
			JSONObject value = new JSONObject();
			int index = player == null ? -1 : player.getCurrentMediaItemIndex();
			value.put("state", error != null ? "error" : player == null || player.getMediaItemCount() == 0 ? "idle" : player.getPlaybackState() == Player.STATE_ENDED ? (queueComplete ? "ended" : player.getPlayWhenReady() ? "waiting" : "paused") : player.isPlaying() ? "playing" : player.getPlaybackState() == Player.STATE_BUFFERING ? "loading" : "paused");
			value.put("index", index);
			if (player.getCurrentMediaItem() != null) value.put("id", player.getCurrentMediaItem().mediaId);
			value.put("currentTime", player == null ? 0 : Math.max(0, player.getCurrentPosition()) / 1000.0);
			value.put("duration", player == null || player.getDuration() < 0 ? 0 : player.getDuration() / 1000.0);
			if (error != null) value.put("error", error);
			AudioBridge.publish(value.toString());
		} catch (Exception ignored) { }
	}

	@Override public void onDestroy() {
		if (active == this) active = null;
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
