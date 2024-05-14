import { FlashList } from "@shopify/flash-list";
import { useMemo } from "react";
import { Text, View } from "react-native";

import { useAlbumsForMediaCard } from "@/api/albums";
import { useGetColumn } from "@/hooks/layout";

import { MediaCard } from "@/components/media/MediaCard";
import { Loading } from "@/components/ui/Loading";

/** @description Screen for `/album` route. */
export default function AlbumScreen() {
  const { isPending, data } = useAlbumsForMediaCard();
  const columnParams = useMemo(
    () => ({ cols: 2, gap: 16, gutters: 32, minWidth: 175 }),
    [],
  );
  const { count, width } = useGetColumn(columnParams);

  /*
    Utilized janky margin method to do `justify-content: space-between`
    with FlashList with columns as FlashList does some weird layout magic
    and puts random spaces between or after elements sometimes.
      - https://github.com/shopify/flash-list/discussions/804#discussioncomment-5509022
  */
  return (
    <View className="-mx-2 flex-1 px-4">
      <FlashList
        numColumns={count}
        estimatedItemSize={width + 37} // 35px `<TextStack />` Height + 2px Margin Top
        data={data}
        keyExtractor={({ href }) => href}
        renderItem={({ item: data }) => (
          <View className="mx-2 mb-4">
            <MediaCard {...data} size={width} />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isPending ? (
            <Loading />
          ) : (
            <Text className="mx-auto text-center font-geistMono text-base text-foreground100">
              No Albums Found
            </Text>
          )
        }
        contentContainerStyle={{ paddingTop: 22 }}
      />
    </View>
  );
}
