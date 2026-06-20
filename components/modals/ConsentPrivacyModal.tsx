import { BlurView } from "expo-blur";
import {
  BarChart3,
  Lock,
  Settings,
  Shield,
  TrendingUp,
} from "lucide-react-native";
import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ConsentPreferences = {
  preferences: boolean;
  analytics: boolean;
};

type ConsentPrivacyModalProps = {
  visible: boolean;
  preferences: ConsentPreferences;
  onChangePreferences: (next: ConsentPreferences) => void;
  onAcceptSelected: () => void;
  onAcceptAll: () => void;
  onRequestClose?: () => void;
};

type ConsentOptionProps = {
  title: string;
  subtitle: string;
  icon: "shieldLock" | "settings" | "analytics";
  value: boolean;
  disabled?: boolean;
  sideLabel?: string;
  onValueChange?: (value: boolean) => void;
  compact: boolean;
};

const brandBlue = "#5061FF";
const lightBlue = "#7C89FF";

const iconColor = "#8FA7FF";

const Toggle = ({
  value,
  disabled,
  onValueChange,
}: {
  value: boolean;
  disabled?: boolean;
  onValueChange?: (value: boolean) => void;
}) => (
  <Switch
    value={value}
    disabled={disabled}
    onValueChange={onValueChange}
    trackColor={{ false: "#D7DEE8", true: brandBlue }}
    thumbColor={disabled ? "#AAB3C2" : "#FFFFFF"}
    ios_backgroundColor="#D7DEE8"
  />
);

const OptionIcon = ({ type }: { type: ConsentOptionProps["icon"] }) => {
  if (type === "settings") {
    return <Settings color={iconColor} size={22} strokeWidth={2.4} />;
  }

  if (type === "analytics") {
    return (
      <View className="h-7 w-7 items-center justify-center">
        <BarChart3 color={iconColor} size={22} strokeWidth={2.4} />
        <TrendingUp
          color={iconColor}
          size={14}
          strokeWidth={2.7}
          style={styles.analyticsArrow}
        />
      </View>
    );
  }

  return (
    <View className="h-7 w-7 items-center justify-center">
      <Shield color={iconColor} size={25} strokeWidth={2.3} />
      <Lock
        color={iconColor}
        size={10}
        strokeWidth={3}
        style={styles.lockIcon}
      />
    </View>
  );
};

const ConsentOption = ({
  title,
  subtitle,
  icon,
  value,
  disabled = false,
  sideLabel,
  onValueChange,
  compact,
}: ConsentOptionProps) => (
  <View
    className="w-full flex-row items-center rounded-[18px] border border-[#E4ECF7] bg-white"
    style={[
      styles.optionCard,
      {
        padding: compact ? 10 : 12,
        minHeight: compact ? 88 : 104,
      },
    ]}
  >
    <View
      className="mr-2 h-9 w-9 items-center justify-center rounded-full bg-[#EEF5FF]"
      style={compact ? styles.compactIconShell : undefined}
    >
      <OptionIcon type={icon} />
    </View>

    <View className="min-w-0 flex-1 pr-2">
      <Text
        className="font-open-sans-semibold text-[#000746]"
        style={{
          fontSize: compact ? 11 : 12,
          lineHeight: compact ? 14 : 16,
        }}
      >
        {title}
      </Text>
      <Text
        className="mt-1 font-open-sans text-[#42526B]"
        style={{
          fontSize: compact ? 9.5 : 10.5,
          lineHeight: compact ? 12 : 14,
        }}
      >
        {subtitle}
      </Text>
    </View>

    <View className="flex-row items-center justify-end">
      {sideLabel ? (
        <Text
          className="mr-1 text-right font-open-sans-semibold text-[#6B7280]"
          style={{
            fontSize: compact ? 8.5 : 9.5,
            lineHeight: 12,
            maxWidth: compact ? 48 : 58,
          }}
        >
          {sideLabel}
        </Text>
      ) : null}
      <Toggle value={value} disabled={disabled} onValueChange={onValueChange} />
    </View>
  </View>
);

export default function ConsentPrivacyModal({
  visible,
  preferences,
  onChangePreferences,
  onAcceptSelected,
  onAcceptAll,
  onRequestClose,
}: ConsentPrivacyModalProps) {
  const { height, width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = height < 760;
  const isMobileWidth = width < 600;
  const modalMaxHeight = height - insets.top - insets.bottom - 24;
  const modalHeight = isMobileWidth
    ? height - insets.top - insets.bottom - 36
    : undefined;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onRequestClose}
    >
      <BlurView intensity={55} tint="dark" className="flex-1">
        <Pressable
          className="flex-1 items-center justify-center bg-black/35 px-4"
          onPress={onRequestClose}
        >
          <Pressable
            className="w-full max-w-[520px] rounded-[28px] border border-white bg-[#F7FBFF]"
            style={[
              styles.modalCard,
              {
                height: modalHeight,
                maxHeight: modalMaxHeight,
                padding: compact ? 16 : 20,
              },
            ]}
          >
            <View className="flex-row items-start">
              <View
                className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-[#E8F3FF]"
                style={compact ? styles.compactHeaderIcon : undefined}
              >
                <Shield color={lightBlue} size={compact ? 22 : 25} />
              </View>
              <View className="min-w-0 flex-1">
                <Text
                  className="font-safiro text-[#000746]"
                  style={{
                    fontSize: compact ? 17 : 19,
                    lineHeight: compact ? 20 : 23,
                  }}
                >
                  Gestão de Consentimento e Privacidade
                </Text>
                <Text
                  className="mt-2 font-open-sans text-[#41516A]"
                  style={{
                    fontSize: compact ? 10.5 : 11.5,
                    lineHeight: compact ? 14 : 16,
                  }}
                >
                  Valorizamos a sua privacidade e transparência. A AIDE utiliza
                  tecnologias de armazenamento local para autenticação e
                  personalização. Gerencie as suas preferências as abaixo, em
                  total conformidade com o RGPD.
                </Text>
              </View>
            </View>

            <View className="mt-4 gap-3">
              <ConsentOption
                compact={compact}
                icon="shieldLock"
                title="Estrutamente Necessários (Tokens JWT)"
                subtitle="Essenciais para a autenticação e segurança do login. Não partilham dados com terceiros."
                value={false}
                disabled
                sideLabel="Sempre Ativo"
              />
              <ConsentOption
                compact={compact}
                icon="settings"
                title="Preferências (Armazenamento Local)"
                subtitle="Guardam definições de interface, como o tema visual e opções de acessibilidade. Garante conformidade parcial com normas WCAG 2.2 AA."
                value={preferences.preferences}
                onValueChange={(value) =>
                  onChangePreferences({ ...preferences, preferences: value })
                }
              />
              <ConsentOption
                compact={compact}
                icon="analytics"
                title="Melhorias do Serviço (Analíticas Anónimas)"
                subtitle="Recolhe dados de uso anónimos para otimizar o desempenho do app e a experiência do utilizador. Não para publicidade."
                value={preferences.analytics}
                onValueChange={(value) =>
                  onChangePreferences({ ...preferences, analytics: value })
                }
              />
            </View>

            <View className="mt-4 gap-3">
              <TouchableOpacity
                className="h-12 items-center justify-center rounded-[18px] bg-[#000746]"
                onPress={onAcceptSelected}
                accessibilityRole="button"
                accessibilityLabel="Aceitar Selecionados"
                accessibilityLanguage="pt-PT"
              >
                <Text className="font-open-sans-semibold text-[14px] text-white">
                  Aceitar Selecionados
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="h-12 items-center justify-center rounded-[18px] border border-[#000746] bg-white"
                onPress={onAcceptAll}
                accessibilityRole="button"
                accessibilityLabel="Aceitar Todos"
                accessibilityLanguage="pt-PT"
              >
                <Text className="font-open-sans-semibold text-[14px] text-[#000746]">
                  Aceitar Todos
                </Text>
              </TouchableOpacity>
            </View>

            <Text
              className="mt-4 text-center font-open-sans-semibold text-[#5B667A]"
              style={{ fontSize: compact ? 9.5 : 10.5, lineHeight: 13 }}
            >
              Em conformidade com RGPD e Diretrizes Europeias.
            </Text>
          </Pressable>
        </Pressable>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalCard: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  optionCard: {
    shadowColor: "#5061FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  lockIcon: {
    position: "absolute",
    bottom: 7,
    right: 6,
  },
  analyticsArrow: {
    position: "absolute",
    right: 1,
    top: 1,
  },
  compactIconShell: {
    height: 32,
    width: 32,
  },
  compactHeaderIcon: {
    height: 36,
    width: 36,
  },
});
