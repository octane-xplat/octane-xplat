package com.octanexplat.tracking;

import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import com.google.android.gms.ads.identifier.AdvertisingIdClient;
import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailabilityLight;
import org.json.JSONObject;

/** Advertising ID calls stay off NativeScript's shared JS/UI thread. No ID cache. */
public final class TrackingBridge {
    public interface Callback { void receive(String json); }
    private static boolean reading;
    private TrackingBridge() {}

    public static boolean available(Context context) {
        return context != null && GoogleApiAvailabilityLight.getInstance().isGooglePlayServicesAvailable(context) == ConnectionResult.SUCCESS;
    }
    private static String reply(String identifier, String error) {
        try {
            JSONObject value = new JSONObject();
            if (error != null) value.put("error", error);
            else value.put("identifier", identifier == null ? JSONObject.NULL : identifier);
            return value.toString();
        } catch (Exception ignored) { return "{\"error\":\"Could not serialize advertising identifier reply\"}"; }
    }
    public static void readAdvertisingId(Context context, Callback callback) {
        if (context == null) { callback.receive(reply(null, "Android application context is unavailable")); return; }
        final Context application = context.getApplicationContext();
        if (Build.VERSION.SDK_INT >= 33 && application.getApplicationInfo().targetSdkVersion >= 33 && application.checkSelfPermission("com.google.android.gms.permission.AD_ID") != PackageManager.PERMISSION_GRANTED) {
            callback.receive(reply(null, "Declare com.google.android.gms.permission.AD_ID in AndroidManifest.xml and rebuild")); return;
        }
        synchronized (TrackingBridge.class) {
            if (reading) { callback.receive(reply(null, "An advertising identifier request is already pending")); return; }
            reading = true;
        }
        Thread worker = new Thread(() -> {
            String result;
            try {
                AdvertisingIdClient.Info info = AdvertisingIdClient.getAdvertisingIdInfo(application);
                String identifier = info.isLimitAdTrackingEnabled() ? null : info.getId();
                if ("00000000-0000-0000-0000-000000000000".equals(identifier)) identifier = null;
                result = reply(identifier, null);
            } catch (Exception error) {
                // Never include provider exception text, which may contain private data.
                result = reply(null, "Google Play advertising identifier service is unavailable or failed");
            } finally {
                synchronized (TrackingBridge.class) { reading = false; }
            }
            final String packet = result;
            new Handler(Looper.getMainLooper()).post(() -> callback.receive(packet));
        }, "OctaneAdvertisingIdentifier");
        worker.setDaemon(true);
        try { worker.start(); }
        catch (RuntimeException error) {
            synchronized (TrackingBridge.class) { reading = false; }
            callback.receive(reply(null, "Could not start the advertising identifier reader"));
        }
    }
}
