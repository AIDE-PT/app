import { useConsent } from "@/contexts/ConsentContext";
import { X } from "lucide-react-native";
import React from "react";
import {
  Modal,
  Pressable,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path, Rect } from "react-native-svg";

const HeaderShieldIcon = () => (
  <View className="mr-3 h-10 w-10 items-center justify-center rounded-[18px] bg-[#DCEEFF]">
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3L5.5 5.6V10.9C5.5 15.15 8.22 19.1 12 20.5C15.78 19.1 18.5 15.15 18.5 10.9V5.6L12 3Z"
        stroke="#56A7FF"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="M12 8.2C11.1 8.2 10.38 8.92 10.38 9.82V10.55H9.8V13.9H14.2V10.55H13.62V9.82C13.62 8.92 12.9 8.2 12 8.2Z"
        fill="#56A7FF"
      />
    </Svg>
  </View>
);

const LockedShieldIcon = () => (
  <View className="relative h-10 w-10 items-center justify-center rounded-[18px] bg-[#DCEEFF]">
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3L5.5 5.6V10.9C5.5 15.15 8.22 19.1 12 20.5C15.78 19.1 18.5 15.15 18.5 10.9V5.6L12 3Z"
        stroke="#56A7FF"
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
    <View className="absolute bottom-1.5 right-1.5 h-4 w-4 items-center justify-center rounded-full bg-[#56A7FF]">
      <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
        <Rect x={6.5} y={11} width={11} height={8} rx={1.5} fill="white" />
        <Path
          d="M9 11V8.8C9 7.25 10.23 6 11.75 6H12.25C13.77 6 15 7.25 15 8.8V11"
          stroke="white"
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  </View>
);

const CogIcon = () => (
  <View className="h-10 w-10 items-center justify-center rounded-[18px] bg-[#DCEEFF]">
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 8.9C10.29 8.9 8.9 10.29 8.9 12C8.9 13.71 10.29 15.1 12 15.1C13.71 15.1 15.1 13.71 15.1 12C15.1 10.29 13.71 8.9 12 8.9Z"
        stroke="#56A7FF"
        strokeWidth={1.8}
      />
      <Path
        d="M19 12C19 11.57 18.96 11.15 18.88 10.76L20.6 9.41L18.59 5.94L16.52 6.61C15.92 6.14 15.24 5.77 14.49 5.52L14.06 3.4H9.94L9.51 5.52C8.76 5.77 8.08 6.14 7.48 6.61L5.41 5.94L3.4 9.41L5.12 10.76C5.04 11.15 5 11.57 5 12C5 12.43 5.04 12.85 5.12 13.24L3.4 14.59L5.41 18.06L7.48 17.39C8.08 17.86 8.76 18.23 9.51 18.48L9.94 20.6H14.06L14.49 18.48C15.24 18.23 15.92 17.86 16.52 17.39L18.59 18.06L20.6 14.59L18.88 13.24C18.96 12.85 19 12.43 19 12Z"
        stroke="#56A7FF"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

const AnalyticsIcon = () => (
  <View className="relative h-10 w-10 items-center justify-center rounded-[18px] bg-[#DCEEFF]">
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x={5} y={11} width={3} height={7} rx={1} fill="#56A7FF" />
      <Rect x={10.5} y={8} width={3} height={10} rx={1} fill="#56A7FF" />
      <Rect x={16} y={5} width={3} height={13} rx={1} fill="#56A7FF" />
      <Path
        d="M6 8.5L10.5 6L13 7.5L18 4.5"
        stroke="#2D5BFF"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16.6 4.5H18.9V6.8"
        stroke="#2D5BFF"
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </View>
);

const ConsentCard = ({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  disabled = false,
  statusLabel,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange?: (nextValue: boolean) => void;
  disabled?: boolean;
  statusLabel?: string;
}) => (
  <View className="mb-2.5 rounded-[18px] border border-[#D6E7FF] bg-[#F9FCFF] p-3">
    <View className="flex-row items-start">
      {icon}

      <View className="ml-3 flex-1">
        <Text className="font-open-sans-semibold text-[13.5px] leading-[18px] text-[#133A72]">
          {title}
        </Text>
        <Text className="mt-1 font-open-sans text-[11.5px] leading-4 text-[#4E6481]">
          {subtitle}
        </Text>
      </View>
    </View>

    <View className="mt-2.5 flex-row items-center justify-between rounded-[14px] bg-white px-3 py-2">
      <Text
        className={`font-open-sans text-[12px] ${
          disabled ? "text-[#7A8CA5]" : "text-[#20416F]"
        }`}
      >
        {statusLabel ?? (value ? "Ativado" : "Desativado")}
      </Text>

      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        thumbColor="#FFFFFF"
        trackColor={{
          false: "#CFD8E6",
          true: "#2D5BFF",
        }}
        ios_backgroundColor="#CFD8E6"
      />
    </View>
  </View>
);

export default function ConsentModal() {
  const {
    draft,
    isLoading,
    isModalVisible,
    isPreviewMode,
    setDraftValue,
    acceptSelected,
    acceptAll,
    closeConsentPreview,
  } = useConsent();

  if (isLoading) {
    return null;
  }

  return (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="fade"
      onRequestClose={closeConsentPreview}
    >
      <Pressable
        className="flex-1 items-center justify-center bg-[#0A1C3A]/55 px-3.5 py-4"
        onPress={isPreviewMode ? closeConsentPreview : undefined}
      >
        <Pressable
          className="w-full max-w-[348px] overflow-hidden rounded-[26px] bg-white"
          onPress={() => {}}
        >
          <View className="p-4">
            <View className="flex-row items-start justify-between">
              <View className="mr-4 flex-1 flex-row items-center">
                <HeaderShieldIcon />

                <Text className="flex-1 font-open-sans-semibold text-[17px] leading-[22px] text-[#133A72]">
                  Gestão de Consentimento e Privacidade
                </Text>
              </View>

              {isPreviewMode ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Fechar pré-visualização do consentimento"
                  className="mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-[#EFF5FF]"
                  onPress={closeConsentPreview}
                >
                  <X size={16} color="#133A72" />
                </TouchableOpacity>
              ) : null}
            </View>

            <Text className="mt-3 font-open-sans text-[11.5px] leading-4.5 text-[#5A6E8A]">
              Valorizamos a sua privacidade e transparência. A AIDE utiliza
              tecnologias de armazenamento local para autenticação e
              personalização. Gerencie as suas preferências as abaixo, em total
              conformidade com o RGPD.
            </Text>

            <View className="mt-4">
              <ConsentCard
                icon={<LockedShieldIcon />}
                title="Estrutamente Necessários (Tokens JWT)"
                subtitle="Essenciais para a autenticação e segurança do login. Não partilham dados com terceiros."
                value
                disabled
                statusLabel="Sempre Ativo"
              />

              <ConsentCard
                icon={<CogIcon />}
                title="Preferências (Armazenamento Local)"
                subtitle="Guardam definições de interface, como o tema visual e opções de acessibilidade. Garante conformidade parcial com normas WCAG 2.2 AA."
                value={draft.preferences}
                onValueChange={(nextValue) =>
                  setDraftValue("preferences", nextValue)
                }
              />

              <ConsentCard
                icon={<AnalyticsIcon />}
                title="Melhorias do Serviço (Analíticas Anónimas)"
                subtitle="Recolhe dados de uso anónimos para otimizar o desempenho do app e a experiência do utilizador. Não para publicidade."
                value={draft.analytics}
                onValueChange={(nextValue) =>
                  setDraftValue("analytics", nextValue)
                }
              />
            </View>

            <View className="mt-0.5">
              <TouchableOpacity
                className="items-center rounded-[14px] bg-[#163B78] px-4 py-2.5"
                onPress={() => {
                  void acceptSelected();
                }}
              >
                <Text className="font-open-sans-semibold text-[13px] text-white">
                  Aceitar Selecionados
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="mt-2 items-center rounded-[14px] border border-[#163B78] bg-white px-4 py-2.5"
                onPress={() => {
                  void acceptAll();
                }}
              >
                <Text className="font-open-sans-semibold text-[13px] text-[#163B78]">
                  Aceitar Todos
                </Text>
              </TouchableOpacity>
            </View>

            <Text className="mt-3 text-center font-open-sans text-[10.5px] text-[#71839B]">
              Em conformidade com RGPD e Diretrizes Europeias.
            </Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
