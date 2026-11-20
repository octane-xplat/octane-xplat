/* The SDK omits functions whose arguments use Graphene's SIMD matrix.
 * These pointer-only declarations preserve the native calling ABI. */
int gtk_widget_compute_transform(void *widget, void *target, void *out_transform);
void gtk_snapshot_transform_matrix(void *snapshot, const void *matrix);
