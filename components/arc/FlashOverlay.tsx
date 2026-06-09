import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { ARC_COLORS } from '@/lib/arcTheme';

export interface FlashOverlayHandle {
  flashSuccess: () => void;
  flashFailure: () => void;
}

export const FlashOverlay = forwardRef<FlashOverlayHandle>(function FlashOverlay(_, ref) {
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const colorRef = useRef(ARC_COLORS.ember);
  const bgAnim = useRef(new Animated.Value(0)).current;

  useImperativeHandle(ref, () => ({
    flashSuccess: () => {
      colorRef.current = ARC_COLORS.ember;
      Animated.sequence([
        Animated.timing(opacityAnim, { toValue: 0.85, duration: 80, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    },
    flashFailure: () => {
      colorRef.current = ARC_COLORS.danger;
      Animated.sequence([
        Animated.timing(opacityAnim, { toValue: 0.75, duration: 80, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start();
    },
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, {
        backgroundColor: colorRef.current,
        opacity: opacityAnim,
        zIndex: 999,
      }]}
    />
  );
});
