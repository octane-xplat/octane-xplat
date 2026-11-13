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
    private int recreationRequests;
    private int epoch, runtimeStarts;
    private String runToken;
    void setRunToken(String value) { runToken = value; }
    public static boolean isOrdinaryStartup() {
        return HomeBuild.STARTUP && android.app.Application.getProcessName().endsWith(":ordinary");
    }
    private final java.util.List<java.lang.ref.WeakReference<android.view.View>> retiredViews = new java.util.ArrayList<>();
    private final java.util.List<java.lang.ref.WeakReference<org.nativescript.mason.masonkit.Node>> retiredNodes = new java.util.ArrayList<>();
    private int retiredGenerations;
    void observeRetirement(HomeScene scene) {
        checkRetirement(scene.count() == 19);
        retiredGenerations++;
        for (int index = 0; index < scene.count(); index++) {
            retiredViews.add(new java.lang.ref.WeakReference<>(scene.getView(index)));
            retiredNodes.add(new java.lang.ref.WeakReference<>(scene.getOriginalNode(index)));
        }
    }
    private void checkRetirement(boolean value) { if (!value) throw new IllegalStateException("Unexpected Home retirement shape"); }
    String snapshotRetired() {
        try {
            org.json.JSONArray views = new org.json.JSONArray(), nodes = new org.json.JSONArray();
            for (int index = 0; index < retiredViews.size(); index++) if (retiredViews.get(index).get() != null) views.put(index);
            for (int index = 0; index < retiredNodes.size(); index++) if (retiredNodes.get(index).get() != null) nodes.put(index);
            return new JSONObject().put("retiredGenerations", retiredGenerations)
                .put("observedViews", retiredViews.size()).put("observedNodes", retiredNodes.size())
                .put("aliveViews", views).put("aliveNodes", nodes).toString();
        } catch (Exception error) { throw new RuntimeException(error); }
    }
    @Override public void onCreate() {
        if (com.tns.Runtime.isInitialized()) throw new IllegalStateException("Runtime started before Home host");
        // Core initializes this process singleton from an Activity callback.
        // Bind its context to the Application before that first callback so
        // it cannot retain a retired Activity and its native bootstrap tree.
        org.nativescript.widgets.image.Fetcher.getInstance(getApplicationContext());
        try { record(new JSONObject().put("event", "native-image-fetcher-initialized").put("epoch", 0)
            .put("context", "application").put("runtimeStarted", com.tns.Runtime.isInitialized())
            .put("runtimeLibraryLoaded", com.tns.Runtime.nativeLibraryLoaded)); }
        catch (org.json.JSONException error) { throw new RuntimeException(error); }
        if (isOrdinaryStartup()) {
            recordEngine("engine-init-begin"); startRuntime(); recordEngine("engine-init-end");
        }
    }
    private void recordEngine(String event) {
        try { record(new JSONObject().put("event", event).put("epoch", 0)
            .put("runtimeStarted", com.tns.Runtime.isInitialized()).put("runtimeLibraryLoaded", com.tns.Runtime.nativeLibraryLoaded)); }
        catch (org.json.JSONException error) { throw new RuntimeException(error); }
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
    boolean requestRecreation() { if (recreationRequests >= HomeBuild.RECREATIONS) return false; recreationRequests++; return true; }
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
            event.put("elapsedRealtimeNanos", android.os.SystemClock.elapsedRealtimeNanos());
            event.put("debuggable", (getApplicationInfo().flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0);
            if (HomeBuild.STARTUP) event.put("processName", android.app.Application.getProcessName())
                .put("processStartNanos", android.os.Process.getStartElapsedRealtime() * 1000000L).put("pid", android.os.Process.myPid()).put("runToken", runToken);
            android.os.Trace.beginSection("XplatHome:" + event.optString("event") + ":" + event.optInt("epoch"));
            android.os.Trace.endSection();
            event.put("runtimeStarts", runtimeStarts); events.put(event);
            if (HomeBuild.STARTUP && !(event.optString("event").equals("startup-complete") ||
                event.optString("event").equals("startup-input") ||
                event.optString("event").equals("failed") || event.optString("phase").equals("failed"))) return;
            if (HomeBuild.STARTUP) android.os.Trace.beginSection("XplatHomeReceiptWrite");
            try {
                File pending = new File(getFilesDir(), "probe-result.json.tmp");
                try (FileOutputStream out = new FileOutputStream(pending)) { out.write((HomeBuild.STARTUP ? events.toString() : events.toString(2)).getBytes(StandardCharsets.UTF_8)); }
                android.system.Os.rename(pending.getAbsolutePath(), new File(getFilesDir(), "probe-result.json").getAbsolutePath());
            } finally { if (HomeBuild.STARTUP) android.os.Trace.endSection(); }
            if (!HomeBuild.STARTUP) android.util.Log.i("XplatPrerender", event.toString());
        } catch (Exception error) { throw new RuntimeException(error); }
    }
}
