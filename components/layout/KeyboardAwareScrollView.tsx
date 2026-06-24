import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  ViewStyle,
} from "react-native";

type KeyboardAwareScrollViewProps = ScrollViewProps & {
  bottomPadding?: number;
  keyboardVerticalOffset?: number;
};

export function KeyboardAwareScrollView({
  children,
  contentContainerStyle,
  bottomPadding = 32,
  keyboardVerticalOffset = 0,
  ...props
}: KeyboardAwareScrollViewProps) {
  const baseContentStyle: StyleProp<ViewStyle> = {
    flexGrow: 1,
    paddingBottom: bottomPadding,
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={keyboardVerticalOffset}
      style={{ flex: 1 }}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        contentContainerStyle={[baseContentStyle, contentContainerStyle]}
        {...props}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
