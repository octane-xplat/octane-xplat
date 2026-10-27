package com.octanexplat.geofencing;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import com.google.android.gms.location.Geofence;
import com.google.android.gms.location.GeofencingEvent;
import org.json.JSONArray;
import org.json.JSONObject;

public class GeofenceReceiver extends BroadcastReceiver {
	public static final String PREFS = "xplat_geofence_events";

	@Override
	public void onReceive(Context context, Intent intent) {
		GeofencingEvent event = GeofencingEvent.fromIntent(intent);
		if (event == null || event.hasError()) {
			return;
		}
		String kind = event.getGeofenceTransition() == Geofence.GEOFENCE_TRANSITION_EXIT ? "exit" : "enter";
		java.util.List<Geofence> regions = event.getTriggeringGeofences();
		if (regions == null) {
			return;
		}
		// Queue into SharedPreferences — the JS leaf drains on init and on
		// listener attach, so events that relaunch the app are not lost.
		SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
		try {
			JSONArray queue = new JSONArray(prefs.getString("queue", "[]"));
			for (Geofence region : regions) {
				JSONObject item = new JSONObject();
				item.put("identifier", region.getRequestId());
				item.put("eventType", kind);
				queue.put(item);
			}
			prefs.edit().putString("queue", queue.toString()).apply();
		} catch (Exception ignored) {
		}
	}
}
