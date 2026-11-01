/* Use the pinned public header to lay out OrtApi. Do not hand-maintain table
 * offsets in Nim: additions and calling conventions are part of the C ABI. */
#include "ort_shim.h"
#include <onnxruntime_c_api.h>
#include <stdlib.h>
#include <string.h>

typedef struct {
  const OrtApi *api;
  OrtEnv *env;
  OrtSession *session;
  OrtMemoryInfo *memory;
} XplatOrt;

static void error_text(char **error, const char *message) {
  if (error == NULL) return;
  size_t length = strlen(message) + 1;
  *error = (char *)malloc(length);
  if (*error != NULL) memcpy(*error, message, length);
}
static int failed(XplatOrt *context, OrtStatus *status, char **error) {
  if (status == NULL) return 0;
  error_text(error, context->api->GetErrorMessage(status));
  context->api->ReleaseStatus(status);
  return 1;
}
const char *xplat_ort_version(const void *base) {
  return ((const OrtApiBase *)base)->GetVersionString();
}
void xplat_ort_free_error(char *error) { free(error); }
void xplat_ort_close(void *opaque) {
  XplatOrt *context = (XplatOrt *)opaque;
  if (context == NULL) return;
  if (context->session != NULL) context->api->ReleaseSession(context->session);
  if (context->memory != NULL) context->api->ReleaseMemoryInfo(context->memory);
  if (context->env != NULL) context->api->ReleaseEnv(context->env);
  free(context);
}
void *xplat_ort_open(const void *base, const void *model, size_t model_bytes, int optimization, char **error) {
  const OrtApi *api = ((const OrtApiBase *)base)->GetApi(ORT_API_VERSION);
  if (api == NULL) { error_text(error, "Native ONNX C API version is unavailable"); return NULL; }
  XplatOrt *context = (XplatOrt *)calloc(1, sizeof(XplatOrt));
  if (context == NULL) { error_text(error, "Unable to allocate native ONNX session"); return NULL; }
  context->api = api;
  OrtSessionOptions *options = NULL;
#define CHECK_OPEN(expression) if (failed(context, (expression), error)) goto failure
  CHECK_OPEN(api->CreateEnv(ORT_LOGGING_LEVEL_WARNING, "xplat", &context->env));
  CHECK_OPEN(api->CreateSessionOptions(&options));
  CHECK_OPEN(api->SetIntraOpNumThreads(options, 1));
  CHECK_OPEN(api->SetInterOpNumThreads(options, 1));
  CHECK_OPEN(api->SetSessionExecutionMode(options, ORT_SEQUENTIAL));
  CHECK_OPEN(api->SetSessionGraphOptimizationLevel(options, (GraphOptimizationLevel)optimization));
  CHECK_OPEN(api->CreateSessionFromArray(context->env, model, model_bytes, options, &context->session));
  CHECK_OPEN(api->CreateCpuMemoryInfo(OrtArenaAllocator, OrtMemTypeDefault, &context->memory));
  api->ReleaseSessionOptions(options);
  return context;
failure:
  if (options != NULL) api->ReleaseSessionOptions(options);
  xplat_ort_close(context);
  return NULL;
#undef CHECK_OPEN
}
int xplat_ort_run(void *opaque, const int64_t *ids, const int64_t *mask,
                  const int64_t *types, size_t length, void **output,
                  float **data, size_t *count, char **error) {
  XplatOrt *context = (XplatOrt *)opaque;
  OrtValue *inputs[3] = {NULL, NULL, NULL};
  OrtValue *result = NULL;
  OrtTensorTypeAndShapeInfo *shape = NULL;
  const char *names[3] = {"input_ids", "attention_mask", "token_type_ids"};
  const char *output_name = "last_hidden_state";
  const int64_t *buffers[3] = {ids, mask, types};
  int64_t dims[2] = {1, (int64_t)length};
  int ok = 0;
#define CHECK_RUN(expression) if (failed(context, (expression), error)) goto cleanup
  for (size_t i = 0; i < 3; ++i) {
    CHECK_RUN(context->api->CreateTensorWithDataAsOrtValue(context->memory, (void *)buffers[i],
      length * sizeof(int64_t), dims, 2, ONNX_TENSOR_ELEMENT_DATA_TYPE_INT64, &inputs[i]));
  }
  CHECK_RUN(context->api->Run(context->session, NULL, names, (const OrtValue *const *)inputs,
    3, &output_name, 1, &result));
  CHECK_RUN(context->api->GetTensorTypeAndShape(result, &shape));
  ONNXTensorElementDataType type;
  size_t rank = 0;
  CHECK_RUN(context->api->GetTensorElementType(shape, &type));
  CHECK_RUN(context->api->GetDimensionsCount(shape, &rank));
  if (type != ONNX_TENSOR_ELEMENT_DATA_TYPE_FLOAT || rank != 3) {
    error_text(error, "Unexpected MiniLM embedding output"); goto cleanup;
  }
  int64_t output_dims[3];
  CHECK_RUN(context->api->GetDimensions(shape, output_dims, 3));
  if (output_dims[0] != 1 || output_dims[1] != (int64_t)length || output_dims[2] != 384) {
    error_text(error, "Unexpected MiniLM embedding output"); goto cleanup;
  }
  CHECK_RUN(context->api->GetTensorShapeElementCount(shape, count));
  if (*count != length * 384) { error_text(error, "Unexpected MiniLM embedding output"); goto cleanup; }
  void *mutable_data = NULL;
  CHECK_RUN(context->api->GetTensorMutableData(result, &mutable_data));
  *output = result;
  *data = (float *)mutable_data;
  result = NULL;
  ok = 1;
cleanup:
  if (shape != NULL) context->api->ReleaseTensorTypeAndShapeInfo(shape);
  if (result != NULL) context->api->ReleaseValue(result);
  for (size_t i = 0; i < 3; ++i) if (inputs[i] != NULL) context->api->ReleaseValue(inputs[i]);
  return ok;
#undef CHECK_RUN
}
void xplat_ort_release_output(void *opaque, void *output) {
  XplatOrt *context = (XplatOrt *)opaque;
  if (output != NULL) context->api->ReleaseValue((OrtValue *)output);
}
