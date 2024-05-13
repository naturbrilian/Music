import { Stack } from "expo-router";
import { useCallback, useRef, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { ScrollView, Text, View } from "react-native";
import Animated, { clamp, useSharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors } from "@/constants/Styles";
import { UnstyledBackButton } from "./BackButton";

type AnimatedHeaderProps = { title: string; children: React.ReactNode };

/** @description Have a title animate into the header bar on scroll. */
export function AnimatedHeader({ title, children }: AnimatedHeaderProps) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const titleHeightRef = useRef(0);
  const titleOpacity = useSharedValue(0);
  const [altHeaderBg, setAltHeaderBg] = useState(false);

  const checkTitlePosition = useCallback(
    ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = nativeEvent.contentOffset.y - 22; // Exclude top padding
      const hiddenPercent = (offsetY - titleHeightRef.current + 8) / 16;
      titleOpacity.value = clamp(0, hiddenPercent, 1);
      setAltHeaderBg(offsetY > 16);
    },
    [titleOpacity],
  );

  const reactivelySnap = useCallback(
    ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = nativeEvent.contentOffset.y;
      if (offsetY < 48) scrollRef.current?.scrollTo({ y: 0 });
      else if (offsetY >= 48 && offsetY < titleHeightRef.current + 32)
        scrollRef.current?.scrollTo({ y: titleHeightRef.current + 32 });
    },
    [],
  );

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <Animated.View
              style={{
                paddingTop: insets.top,
                backgroundColor: altHeaderBg
                  ? Colors.surface800
                  : Colors.canvas,
              }}
            >
              <View className="flex h-14 flex-row items-center gap-8 px-4">
                <UnstyledBackButton />
                <Animated.Text
                  numberOfLines={1}
                  style={{ opacity: titleOpacity }}
                  className="font-ndot57 text-lg text-foreground50"
                >
                  {title}
                </Animated.Text>
              </View>
            </Animated.View>
          ),
        }}
      />
      <ScrollView
        ref={scrollRef}
        onScroll={checkTitlePosition}
        onMomentumScrollEnd={reactivelySnap}
        contentContainerClassName="px-4 pb-16 pt-[22px]"
      >
        <Text
          onLayout={({ nativeEvent }) => {
            titleHeightRef.current = nativeEvent.layout.height;
          }}
          className="mb-8 font-ndot57 text-title text-foreground50"
        >
          {title}
        </Text>
        {children}
      </ScrollView>
    </>
  );
}
