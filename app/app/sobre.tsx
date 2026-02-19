import React from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";
import BackButton from "../components/buttons/backButton";
import LightBackground from "@/components/DotBackground";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import AideLogo from "../components/svg/AideLogo";

// Components for the About Page

const SectionTitle = ({ title, isDark }: { title: string; isDark: boolean }) => (
  <Text
    className={`text-xl font-bold mb-3 mt-6 ${
      isDark ? "text-white" : "text-[#1A1A2E]"
    }`}
  >
    {title}
  </Text>
);

const FeatureCard = ({
  icon,
  title,
  description,
  isDark,
}: {
  icon: any;
  title: string;
  description: string;
  isDark: boolean;
}) => (
  <View
    className={`p-4 rounded-xl mb-3 flex-row items-center space-x-4 ${
      isDark ? "bg-[#1A1A2E]" : "bg-white"
    }`}
    style={{
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    }}
  >
    <View
      className={`p-3 rounded-full ${
        isDark ? "bg-blue-500/20" : "bg-blue-50"
      }`}
    >
      {icon}
    </View>
    <View className="flex-1 ml-3">
      <Text
        className={`font-semibold text-base mb-1 ${
          isDark ? "text-white" : "text-gray-900"
        }`}
      >
        {title}
      </Text>
      <Text
        className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
      >
        {description}
      </Text>
    </View>
  </View>
);

const ObjectiveItem = ({
  icon,
  title,
  description,
  isDark,
}: {
  icon: string;
  title: string;
  description: string;
  isDark: boolean;
}) => (
  <View className="mb-6">
    <View className="flex-row items-center mb-2">
      <Text className="text-2xl mr-3">{icon}</Text>
      <Text
        className={`font-bold text-lg flex-1 ${
          isDark ? "text-white" : "text-[#1A1A2E]"
        }`}
      >
        {title}
      </Text>
    </View>
    <Text
      className={`text-base leading-6 pl-2 border-l-2 ${
        isDark ? "text-gray-300 border-gray-700" : "text-gray-600 border-gray-200"
      }`}
    >
      {description}
    </Text>
  </View>
);

const TeamMember = ({ name, isDark }: { name: string; isDark: boolean }) => (
  <View
    className={`px-4 py-3 rounded-lg mb-2 mr-2 ${
      isDark ? "bg-[#1A1A2E]" : "bg-white"
    }`}
    style={{
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    }}
  >
    <Text
      className={`font-medium ${isDark ? "text-gray-200" : "text-gray-800"}`}
    >
      {name}
    </Text>
  </View>
);

const SobrePage = () => {
  const { isDark } = useTheme();

  // Team members sorted alphabetically by first name
  const teamMembers = [
    "Diogo Mota",
    "Francisco Oliveira",
    "Henrique Policarpo",
    "Leonardo Fiuza",
    "Ricardo Araújo",
  ];

  return (
    <LightBackground>
      <View className="flex-1 pt-10 px-4">
        <SafeAreaView className="flex-1">
          <BackButton
            label="Sobre"
            className="mb-4"
            dark={!isDark}
            onPress={() => router.back()}
          />

          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 60 }}
          >
            {/* Header / Intro */}
            <View className="mb-8 items-center">
              <View className="flex-row items-center mb-2">
                <Text className={`text-3xl font-bold ${isDark ? "text-white" : "text-[#1A1A2E]"}`}>Sobre a </Text>              
                  <AideLogo size={65} fill={isDark ? "#ffffff" : "#1A1A2E"} />           
              </View>
              <Text
                className={`text-center text-lg leading-7 ${
                  isDark ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Uma solução tecnológica para dotar os cuidadores de uma gestão centralizada de segurança, rotinas e saúde.
              </Text>
            </View>

            {/* O Que É */}
            <View
              className={`p-6 rounded-2xl mb-8 ${
                isDark ? "bg-[#1f2345]" : "bg-blue-50"
              }`}
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.12,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text
                className={`text-lg leading-7 ${
                  isDark ? "text-gray-200" : "text-[#1A1A2E]"
                }`}
              >
                O projeto assenta na premissa de que cada cenário de cuidado é
                único. A aplicação oferece um ecossistema{" "}
                <Text className="font-bold text-blue-500">modular</Text> e{" "}
                <Text className="font-bold text-blue-500">adaptável</Text> às
                necessidades específicas de cada utilizador.
              </Text>
            </View>

            {/* Core Values */}
            <FeatureCard
              isDark={isDark}
              icon={
                <Ionicons
                  name="shield-checkmark"
                  size={24}
                  color={isDark ? "#60A5FA" : "#3B82F6"}
                />
              }
              title="Privacidade"
              description="Segurança e privacidade em primeiro lugar."
            />
            <FeatureCard
              isDark={isDark}
              icon={
                <MaterialCommunityIcons
                  name="view-grid-plus"
                  size={24}
                  color={isDark ? "#60A5FA" : "#3B82F6"}
                />
              }
              title="Modular"
              description="Adapte às suas necessidades específicas."
            />
            <FeatureCard
              isDark={isDark}
              icon={
                <Ionicons
                  name="heart"
                  size={24}
                  color={isDark ? "#60A5FA" : "#3B82F6"}
                />
              }
              title="Humano"
              description="Tecnologia ao serviço do cuidado."
            />

            {/* Section: Objetivos */}
            <SectionTitle title="Objetivos do Serviço" isDark={isDark} />
            <Text
              className={`text-base leading-6 mb-6 ${
                isDark ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Transformar a experiência do cuidar, focando-se na segurança de
              quem recebe os cuidados e na tranquilidade de quem os presta.
            </Text>

            <View
              className={`p-5 rounded-xl border mb-8 ${
                isDark
                  ? "bg-transparent border-gray-700"
                  : "bg-white border-gray-100"
              }`}
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.12,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text
                className={`font-semibold text-lg mb-2 ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                🎯 Objetivo Geral
              </Text>
              <Text
                className={`text-base leading-6 ${
                  isDark ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Facilitar a vida dos cuidadores informais através da monitorização
                remota e fidedigna das condições de saúde e segurança,
                promovendo uma gestão mais eficiente e menos desgastante.
              </Text>
            </View>

            <SectionTitle title="Objetivos Específicos" isDark={isDark} />
            
            <ObjectiveItem
              isDark={isDark}
              icon="-"
              title="Monitorização em Tempo Real"
              description="Fluxo constante de dados de saúde (frequência cardíaca, glicémia, atividade), mantendo o cuidador sempre a par do estado clínico."
            />
            <ObjectiveItem
              isDark={isDark}
              icon="-"
              title="Mitigação da Distância"
              description="Ponte digital que anula barreiras geográficas, crucial para cuidadores que não coabitam ou precisam de se ausentar."
            />
            <ObjectiveItem
              isDark={isDark}
              icon="-"
              title="Alertas Proativos"
              description="Comunicação instantânea de desvios nos padrões normais de saúde para intervenção rápida em emergências."
            />
            <ObjectiveItem
              isDark={isDark}
              icon="-"
              title="Bem-Estar Emocional"
              description="Redução da ansiedade e sentimento de culpa do cuidador, transmitindo calma e controlo."
            />
            <ObjectiveItem
              isDark={isDark}
              icon="-"
              title="Informação Médica"
              description="Registo histórico de sintomas e eventos para facilitar a comunicação com profissionais de saúde."
            />

            {/* Footer / Team */}
            <View className="mt-8 mb-4 pt-8 border-t border-gray-200 dark:border-gray-800">
              <Text
                className={`text-center font-bold mb-4 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                Desenvolvido na Universidade de Aveiro 🎓
              </Text>
              <View className="flex-row flex-wrap justify-center">
                {teamMembers.map((member) => (
                  <TeamMember key={member} name={member} isDark={isDark} />
                ))}
              </View>
              <Text className={`text-center text-xs mt-6 ${isDark ? "text-white/20" : "text-black/20"}`}>
                  AIDE © 2026 v1.0.0
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </LightBackground>
  );
};

export default SobrePage;
