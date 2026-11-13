package org.octanexplat.prerenderandroid;

import org.json.JSONArray;
import org.json.JSONObject;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;

public final class ProbeApplication extends com.tns.NativeScriptApplication {
    private final JSONArray events = new JSONArray();
    private ProbeBridge bridge;
    private int epoch, activeBridgeEpoch, runtimeStarts;
    boolean forcedRecreation;
    boolean applicationHandoff;

    @Override public void onCreate() {
        // The stock constructor/attachBaseContext establish the native app.
        // Its onCreate runtime initialization runs after the native layout gate.
        if (com.tns.Runtime.isInitialized()) throw new IllegalStateException("Runtime started before native host");
    }

    public static void installBridge(ProbeBridge value) {
        ProbeApplication app = (ProbeApplication) getInstance();
        if (app.bridge != null) throw new IllegalStateException("Bridge already installed");
        app.bridge = value;
    }

    int nextEpoch() { return ++epoch; }

    void bind(ProbeActivity activity) {
        if (bridge == null || activeBridgeEpoch != 0) throw new IllegalStateException("Bridge unavailable or old activity still owns it");
        bridge.onActivity(activity);
    }

    void bound(int value) {
        if (activeBridgeEpoch != 0) throw new IllegalStateException("Duplicate activity owner");
        activeBridgeEpoch = value;
    }

    void unbind(ProbeActivity activity) {
        bridge.onDestroy(activity);
        if (activeBridgeEpoch != 0) throw new IllegalStateException("Old bridge owner not released");
    }

    void released(int value) {
        if (activeBridgeEpoch != value) throw new IllegalStateException("Wrong bridge owner released");
        activeBridgeEpoch = 0;
    }
    void lifecycle(ProbeActivity activity, String event) {
        if (applicationHandoff) bridge.onHostLifecycle(activity, event);
    }

    public void startRuntime() {
        if (++runtimeStarts != 1) throw new IllegalStateException("Runtime initialization repeated");
        super.onCreate();
    }

    void record(JSONObject event) {
        try {
            event.put("activeBridgeEpoch", activeBridgeEpoch);
            event.put("runtimeStarts", runtimeStarts);
            events.put(event);
            // adb may read while a new event is published. Close a same-directory
            // temporary file, then atomically replace the complete receipt.
            File pending = new File(getFilesDir(), "probe-result.json.tmp");
            try (FileOutputStream out = new FileOutputStream(pending)) {
                out.write(events.toString(2).getBytes(StandardCharsets.UTF_8));
            }
            android.system.Os.rename(pending.getAbsolutePath(), new File(getFilesDir(), "probe-result.json").getAbsolutePath());
            android.util.Log.i("XplatPrerender", event.toString());
        } catch (Exception error) { throw new RuntimeException(error); }
    }
}
