import React, { useEffect } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, interpolate } from "react-native-reanimated";
import { colors, radius } from "./theme";

export function Shimmer({ style }: { style?: ViewStyle }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(withTiming(1, { duration: 1200 }), -1, false);
  }, [p]);
  const anim = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.5, 1], [0.35, 0.75, 0.35]),
  }));
  return (
    <View style={[styles.base, style]}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "#DAD5E4" }, anim]} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: "#E9E5F0", borderRadius: radius.md, overflow: "hidden" },
});

export const colorsExport = colors;
