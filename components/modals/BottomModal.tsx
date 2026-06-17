import { useTheme } from "@/hooks/useTheme";
import { BlurView } from "expo-blur";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface BottomModalProps {
  visible: boolean;
  onClose: any;
  children?: any;
}

export default function BottomModal({
  visible,
  onClose,
  children,
}: BottomModalProps) {
  const { isDark } = useTheme();
  const { height } = useWindowDimensions();
  const [isRendered, setIsRendered] = useState(visible);
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(44)).current;

  const sheetHeight = Math.round(
    Math.min(Math.max(height * 0.62, 380), height * 0.82),
  );

  useEffect(() => {
    if (visible) {
      setIsRendered(true);
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sheetOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 170,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(sheetOpacity, {
        toValue: 0,
        duration: 170,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 36,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsRendered(false);
    });
  }, [backdropOpacity, sheetOpacity, sheetTranslateY, visible]);

  if (!isRendered) return null;

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View
          style={[StyleSheet.absoluteFillObject, { opacity: backdropOpacity }]}
        >
          <BlurView intensity={50} tint="dark" style={styles.root}>
            <Pressable className="flex-1 bg-black/30" onPress={onClose} />
          </BlurView>
        </Animated.View>

        <Animated.View
          style={{
            opacity: sheetOpacity,
            transform: [{ translateY: sheetTranslateY }],
          }}
        >
          <View
            className={`pt-3 px-4 pb-4 rounded-t-[30px] ${isDark ? "bg-aide-dark-card" : "bg-[#DBEDF8]"}`}
            style={{ height: sheetHeight }}
          >
            {/* Handle */}
            <View
              className={`w-10 h-1 rounded-2 self-center mb-4 ${isDark ? "bg-white/30" : "bg-[#C7C7C7]"}`}
            />
            <SafeAreaView className="flex-1">
              <ScrollView
                contentContainerStyle={{ paddingBottom: 16 }}
                showsVerticalScrollIndicator={false}
              >
                {children}
              </ScrollView>
            </SafeAreaView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
});
