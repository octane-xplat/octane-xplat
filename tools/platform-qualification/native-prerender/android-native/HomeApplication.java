package org.octanexplat.prerenderandroid;

import org.json.JSONArray;
import org.json.JSONObject;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;

public final class HomeApplication extends com.tns.NativeScriptApplication {
    private final JSONArray events = new JSONArray();
    private HomeBridge bridge;
    private String coldSnapshot;
    private boolean recreationRequested;
    private int epoch, runtimeStarts;
    @Override public void onCreate() {
        if (com.tns.Runtime.isInitialized()) throw new IllegalStateException("Runtime started before Home host");
    }
    public static void installBridge(HomeBridge value) {
        HomeApplication app = (HomeApplication) getInstance();
        if (app.bridge != null) throw new IllegalStateException("Home bridge installed twice");
        app.bridge = value;
    }
    void captureColdSnapshot(String value) {
        if (coldSnapshot != null || com.tns.Runtime.isInitialized() || com.tns.Runtime.nativeLibraryLoaded)
            throw new IllegalStateException("Cold baseline must precede the only runtime start");
        coldSnapshot = value;
    }
    String coldSnapshot() {
        if (coldSnapshot == null) throw new IllegalStateException("Cold baseline missing");
        return coldSnapshot;
    }
    boolean requestRecreation() { if (recreationRequested) return false; recreationRequested = true; return true; }
    int nextEpoch() { return ++epoch; }
    void bind(HomeActivity activity) { if (bridge == null) throw new IllegalStateException("Home bridge missing"); bridge.onActivity(activity); }
    void unbind(HomeActivity activity) { bridge.onDestroy(activity); }
    void lifecycle(HomeActivity activity, String event) { bridge.onHostLifecycle(activity, event); }
    void startRuntime() {
        if (++runtimeStarts != 1) throw new IllegalStateException("Repeated runtime initialization");
        super.onCreate();
    }
    void record(JSONObject event) {
        try {
            event.put("runtimeStarts", runtimeStarts); events.put(event);
            File pending = new File(getFilesDir(), "probe-result.json.tmp");
            try (FileOutputStream out = new FileOutputStream(pending)) { out.write(events.toString(2).getBytes(StandardCharsets.UTF_8)); }
            android.system.Os.rename(pending.getAbsolutePath(), new File(getFilesDir(), "probe-result.json").getAbsolutePath());
            android.util.Log.i("XplatPrerender", event.toString());
        } catch (Exception error) { throw new RuntimeException(error); }
    }
}
