package com.octanexplat.geofencing;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import com.google.android.gms.location.Geofence;
import com.google.android.gms.location.GeofencingEvent;

public class GeofenceReceiver extends BroadcastReceiver {
	@Override
	public void onReceive(Context context, Intent intent) {
		GeofencingEvent event = GeofencingEvent.fromIntent(intent);
		if (event == null || event.hasError()) {
			return;
		}
		int transition = event.getGeofenceTransition();
		String kind = transition == Geofence.GEOFENCE_TRANSITION_EXIT ? "exit" : "enter";
		java.util.List<Geofence> regions = event.getTriggeringGeofences();
		if (regions == null) {
			return;
		}
		for (Geofence region : regions) {
			emit(region.getRequestId(), kind);
		}
	}

	private static void emit(String identifier, String transition) {
		// The JS leaf exposes __xplatGeofenceEmit; reach it through the
		// NativeScript runtime's global object when the runtime is live.
		try {
			java.lang.reflect.Method emit = Class.forName("com.tns.Runtime")
				.getDeclaredMethod("emitGeofenceEvent", String.class, String.class);
			emit.invoke(null, identifier, transition);
		} catch (Throwable ignored) {
			android.util.Log.d("GeofenceReceiver",
				"buffered " + transition + " " + identifier + " — runtime not live");
		}
	}
}
