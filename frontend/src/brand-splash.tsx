import React, { useEffect } from "react";
import { View, StyleSheet, Text, Platform } from "react-native";
import { Image } from "expo-image";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, withDelay, Easing } from "react-native-reanimated";

const LOGO = require("../assets/images/icon.png");

type Props = { onDone: () => void; durationMs?: number };

/**
 * Instagram-style splash overlay.
 * - Cold-start logo pop: scale-in + fade-in, hold ~1.2s, fade-out.
 * - Total: durationMs (default 2000ms).
 */
export function BrandSplash({ onDone, durationMs = 2000 }: Props) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.85);
  const overlayOpacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    scale.value = withSequence(
      withTiming(1.04, { duration: 600, easing: Easing.out(Easing.cubic) }),
      withTiming(1.0, { duration: 300, easing: Easing.inOut(Easing.quad) }),
    );
    // fade out at the end
    overlayOpacity.value = withDelay(
      durationMs - 400,
      withTiming(0, { duration: 400, easing: Easing.in(Easing.quad) })
    );
    const t = setTimeout(onDone, durationMs);
    return () => clearTimeout(t);
  }, [durationMs, onDone, opacity, scale, overlayOpacity]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: overlayOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));

  return (
    <Animated.View pointerEvents="none" style={[styles.wrap, overlayStyle]}>
      <Animated.View style={logoStyle}>
        <Image source={LOGO} style={styles.logo} contentFit="contain" />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    // ensure it sits above the router content on web too
    ...(Platform.OS === "web" ? ({ position: "fixed" } as any) : {}),
  },
  logo: { width: 220, height: 220 },
});
