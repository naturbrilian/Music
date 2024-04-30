import type { Track, TrackWithAlbum } from "../schema";

/** @description Determines if a `Track` is actually a `TrackWithAlbum`. */
export function isTrackWithAlbum(
  data: Track | TrackWithAlbum,
): data is TrackWithAlbum {
  return Object.hasOwn(data, "album");
}
