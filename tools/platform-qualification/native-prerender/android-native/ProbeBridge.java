package org.octanexplat.prerenderandroid;

public interface ProbeBridge {
    void onActivity(ProbeActivity activity);
    void onDestroy(ProbeActivity activity);
    default void onHostLifecycle(ProbeActivity activity, String event) {}
}
