package org.octanexplat.prerenderandroid;
public interface HomeBridge {
    void onActivity(HomeActivity activity);
    void onDestroy(HomeActivity activity);
    default void onHostLifecycle(HomeActivity activity, String event) {}
}
