## Structured failures crossing native async operation boundaries.
import std/json
import ./jsonutil

type ContractFailure* = object of CatchableError
  detail*: JsonNode

proc contractFailure*(code, message: string, options: JsonNode = nil): ref ContractFailure =
  result = newException(ContractFailure,message)
  result.detail = %*{"code": code,"message": message}
  for key in ["recovery","retryable","context"]:
    let value = field(options,key)
    if (key == "retryable" and value != nil) or (key != "retryable" and truthy(value)):
      result.detail[key] = value.copy()

proc failureData*(error: ref CatchableError): JsonNode =
  if error of ContractFailure:
    let detail = cast[ref ContractFailure](error).detail
    if detail != nil and detail.kind == JObject and field(detail,"code") != nil and
        detail["code"].kind == JString and detail["code"].getStr().len > 0 and
        field(detail,"message") != nil and detail["message"].kind == JString:
      return detail.copy()
  %*{"code": "execution_failure","message": error.msg}
