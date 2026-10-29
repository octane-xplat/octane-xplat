package com.octanexplat.stripe;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import com.stripe.android.PaymentConfiguration;
import org.json.JSONObject;

/** One in-memory request; never place client secrets in Intent extras or saved state. */
public final class PaymentSheetBridge {
    public interface Listener { void complete(String code); }
    static final class Request {
        final JSONObject options;
        final Listener listener;
        Request(JSONObject options, Listener listener) { this.options = options; this.listener = listener; }
    }
    private static Request current;
    private PaymentSheetBridge() {}

    public static void initialize(Context context, String json) throws Exception {
        if (current != null) throw new IllegalStateException("Checkout is active");
        JSONObject options = new JSONObject(json);
        PaymentConfiguration.init(context.getApplicationContext(), options.getString("publishableKey"), options.optString("stripeAccountId", null));
    }
    public static void present(Activity activity, String json, Listener listener) throws Exception {
        if (current != null) throw new IllegalStateException("Checkout is active");
        Request request = new Request(new JSONObject(json), listener);
        current = request;
        try { activity.startActivity(new Intent(activity, PaymentSheetActivity.class)); }
        catch (Exception error) { current = null; throw error; }
    }
    static Request request() { return current; }
    static void finish(Request request, String code) {
        if (current != request) return;
        current = null;
        request.listener.complete(code);
    }
}
