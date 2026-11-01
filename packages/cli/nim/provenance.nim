## Shared provenance contract for source, docs and guidance results.
import std/json
import ./jsonutil

proc provenance*(fields: JsonNode): JsonNode =
  result = %*{"scope": "release","package": newJNull(),"requestedVersion": newJNull(),
    "servedVersion": newJNull(),"repo": newJNull(),"tag": newJNull(),"commit": newJNull(),"offline": false}
  for key in ["source","match"]:
    let value = field(fields,key)
    if value != nil: result[key] = value
  for key in ["scope","package","requestedVersion","servedVersion","repo","tag","commit"]:
    let value = field(fields,key)
    if value != nil and value.kind != JNull: result[key] = value
  result["offline"] = %(field(fields,"offline") == %true)

proc unavailable*(reason: string, fields: JsonNode): JsonNode =
  let labeled = fields.copy()
  labeled["match"] = %"unavailable"
  result = %*{"status": "unavailable","reason": reason,"provenance": provenance(labeled)}
  let fallback = field(fields,"fallback")
  if truthy(fallback): result["fallback"] = fallback

proc tagConflict*(cached, remote, fields: JsonNode): JsonNode =
  let labeled = fields.copy()
  let commit = field(cached,"commit")
  if commit != nil: labeled["commit"] = commit
  labeled["match"] = %"tag-conflict"
  %*{"status": "tag-conflict","cached": cached,"remote": remote,"provenance": provenance(labeled)}
