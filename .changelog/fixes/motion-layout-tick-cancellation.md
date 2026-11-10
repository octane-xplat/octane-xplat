### Cancel pending layout animation work during a frame

Motion now honors cancellation of a queued layout animation callback when an earlier callback cancels it during the same frame. Cancelled work no longer runs from a copied delivery batch. Animation timing and public APIs are unchanged.
