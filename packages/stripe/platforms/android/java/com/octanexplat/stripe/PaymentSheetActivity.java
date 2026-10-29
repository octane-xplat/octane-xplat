package com.octanexplat.stripe;

import android.os.Bundle;
import androidx.activity.ComponentActivity;
import com.stripe.android.paymentsheet.PaymentSheet;
import com.stripe.android.paymentsheet.PaymentSheetResult;
import org.json.JSONObject;

/** A fresh Activity registers Stripe's ActivityResult launcher before STARTED. */
public final class PaymentSheetActivity extends ComponentActivity {
    private PaymentSheetBridge.Request request;
    private PaymentSheet sheet;
    private boolean launch;
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        request = PaymentSheetBridge.request();
        if (request == null) { finish(); return; }
        sheet = new PaymentSheet.Builder(result -> {
            String code = result instanceof PaymentSheetResult.Completed ? "" : result instanceof PaymentSheetResult.Canceled ? "Canceled" : "Failed";
            PaymentSheetBridge.finish(request, code);
            finish();
        }).build(this);
        launch = state == null;
    }
    @Override public void onResume() {
        super.onResume();
        if (!launch || request == null) return;
        launch = false;
        try {
            JSONObject options = request.options;
            PaymentSheet.Configuration.Builder configuration = new PaymentSheet.Configuration.Builder(options.getString("merchantDisplayName"));
            if (options.has("primaryButtonLabel")) configuration.primaryButtonLabel(options.getString("primaryButtonLabel"));
            JSONObject wallet = options.optJSONObject("googlePay");
            if (wallet != null) configuration.googlePay(new PaymentSheet.GooglePayConfiguration(
                wallet.optBoolean("testEnv", false) ? PaymentSheet.GooglePayConfiguration.Environment.Test : PaymentSheet.GooglePayConfiguration.Environment.Production,
                wallet.getString("merchantCountryCode"), wallet.optString("currencyCode", null)
            ));
            sheet.presentWithPaymentIntent(options.getString("paymentIntentClientSecret"), configuration.build());
        } catch (Exception error) {
            PaymentSheetBridge.finish(request, "Failed");
            finish();
        }
    }
    @Override public void onDestroy() {
        if (isFinishing() && request != null) PaymentSheetBridge.finish(request, "Canceled");
        super.onDestroy();
    }
}
