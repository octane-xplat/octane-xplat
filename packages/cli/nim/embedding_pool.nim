## Float32 model output -> attention-mask mean -> normalized JS Number vector.
import std/math

proc poolEmbedding*(values: openArray[float32], mask: openArray[int64], dimensions: int): seq[float] =
  if dimensions < 0 or (dimensions > 0 and mask.len > high(int) div dimensions) or values.len != mask.len*dimensions:
    raise newException(ValueError,"Embedding shape mismatch")
  result = newSeq[float](dimensions)
  var count = 0
  for token, attended in mask:
    if attended == 0: continue
    inc count
    for dim in 0..<dimensions: result[dim] += float(values[token*dimensions+dim])
  if count == 0: raise newException(ValueError,"Embedding has no attended tokens")
  var scale = 0.0
  for value in result.mitems:
    value /= float(count)
    if classify(value) in {fcNan,fcInf,fcNegInf}: raise newException(ValueError,"Invalid embedding output")
    scale = max(scale,abs(value))
  if scale == 0: raise newException(ValueError,"Invalid embedding output")
  var sum, correction: float
  for value in result:
    let part = value/scale
    let term = part*part-correction
    let next = sum+term
    correction = (next-sum)-term
    sum = next
  let norm = sqrt(sum)*scale
  for value in result.mitems: value /= norm
