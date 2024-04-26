import type { Href } from "expo-router";
import { atom } from "jotai";
import { unwrap } from "jotai/utils";

import { db } from "@/db";

import { createAtomWithStorage } from "@/lib/jotai";
import { isFulfilled } from "@/utils/promise";
import type { MediaCardContent } from "@/components/media/MediaCard";
import { getTrackCountStr } from "@/features/track/utils";
import type { TTrackSrc } from "../utils/trackList";
import { SpecialPlaylists } from "../utils/trackList";

/** @description [FOR INTERNAL USE ONLY] List of up to 10 `TTrackSrc` that we've played. */
export const recentlyPlayedAsyncAtom = createAtomWithStorage<TTrackSrc[]>(
  "recently-played",
  [],
);

/** @description [FOR INTERNAL USE ONLY] Gets info about the recently played media. */
const recentlyPlayedDataAsyncAtom = atom(async (get) => {
  try {
    const recentlyPlayed = await get(recentlyPlayedAsyncAtom);
    return (await Promise.allSettled(recentlyPlayed.map(getRecentMediaInfo)))
      .filter(isFulfilled)
      .map(({ value }) => value);
  } catch (err) {
    return [];
  }
});
/** @description Info about the recently played media. */
export const recentlyPlayedDataAtom = unwrap(
  recentlyPlayedDataAsyncAtom,
  (prev) => prev ?? [],
);

/** @description Gets enough info about media to be used with `<MediaCard />`. */
async function getRecentMediaInfo<T>({
  type,
  ref,
}: TTrackSrc): Promise<MediaCardContent<T>> {
  if (type === "album") {
    const album = await db.query.albums.findFirst({
      where: (fields, { eq }) => eq(fields.id, ref),
      with: { tracks: { columns: { id: true } } },
    });
    if (!album) throw new Error("Album doesn't exist.");
    return {
      type,
      // FIXME: Temporary `Href<T>` until Expo SDK 51
      href: `/album/${ref}` as Href<T>,
      title: album.name,
      subtitle: album.artistName,
      extra: `| ${getTrackCountStr(album.tracks.length)}`,
      source: album.coverSrc,
    };
  } else if (type === "artist") {
    const artist = await db.query.artists.findFirst({
      where: (fields, { eq }) => eq(fields.name, ref),
      with: { tracks: { columns: { id: true } } },
    });
    if (!artist) throw new Error("Artist doesn't exist.");
    return {
      type,
      href: `/artist/${ref}` as Href<T>,
      title: artist.name,
      subtitle: getTrackCountStr(artist.tracks.length),
      source: null,
    };
  } else {
    switch (ref) {
      case SpecialPlaylists.favorites: {
        const tracks = await db.query.tracks.findMany({
          where: (fields, { eq }) => eq(fields.isFavorite, true),
          columns: { id: true },
        });
        return {
          type,
          href: `/playlist/${SpecialPlaylists.favorites}` as Href<T>,
          title: SpecialPlaylists.favorites,
          subtitle: getTrackCountStr(tracks.length),
          source: SpecialPlaylists.favorites,
        };
      }
      case SpecialPlaylists.tracks: {
        const tracks = await db.query.tracks.findMany({
          columns: { id: true },
        });
        return {
          type,
          href: "/track" as Href<T>,
          title: SpecialPlaylists.tracks,
          subtitle: getTrackCountStr(tracks.length),
          source: null,
        };
      }
      default: {
        const playlist = await db.query.playlists.findFirst({
          where: (fields, { eq }) => eq(fields.name, ref),
          with: {
            tracksToPlaylists: {
              columns: { trackId: false, playlistName: false },
              with: {
                track: {
                  with: { album: true },
                },
              },
            },
          },
        });
        if (!playlist) throw new Error("Playlist doesn't exist.");
        return {
          type,
          href: `/playlist/${ref}` as Href<T>,
          title: playlist.name,
          subtitle: getTrackCountStr(playlist.tracksToPlaylists.length),
          source:
            playlist.coverSrc ??
            playlist.tracksToPlaylists
              .toSorted((a, b) => a.track.name.localeCompare(b.track.name))
              .slice(0, 4)
              .map(({ track }) => track.album?.coverSrc ?? track.coverSrc),
        };
      }
    }
  }
}
