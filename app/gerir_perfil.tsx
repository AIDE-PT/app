import BackButton from "@/components/buttons/backButton";
import { Button } from "@/components/buttons/button";
import LightBackground from "@/components/DotBackground";
import { useAuth } from "@/contexts/AuthContext";
import useHealthConnectStatus from "@/hooks/useHealthConnectStatus";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Camera, Pencil } from "lucide-react-native";
import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import GerirPerfilFormulario from "../components/gerir_perfil_formulario";

const GerirPerfil = () => {
  const [isEditing, setIsEditing] = useState(false);
  const { isDark } = useTheme();
  const { signOut } = useAuth();
  const { status: healthConnectStatus, isLoading: isLoadingHealthConnect } =
    useHealthConnectStatus();

  const [userData, setUserData] = useState({
    nome: "Emília Almeida",
    email: "almeida.emilia@gmail.com",
    contacto: "+351 983 987 657",
    nif: "231432256",
    password: "password123",
  });

  const handleSave = () => {
    setIsEditing(false);
    console.log("Alterações salvas localmente:", userData);
  };

  return (
    <LightBackground>
      <View className="flex-1 px-4 pt-10">
        <SafeAreaView className="flex-1">
          {/* Header */}
          <View className="mb-4">
            <BackButton label="Gerir Perfil" dark={isDark} />
          </View>
          <ScrollView
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Foto de Perfil */}
            <View className="items-center my-6">
              <View
                className={`w-32 h-32 rounded-full items-center justify-center relative border-4 ${isDark ? "bg-[#1a1a2e] border-white/20" : "bg-[#E0E0E0] border-white"}`}
                style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
              >
                <Text
                  className={`text-4xl font-medium ${isDark ? "text-white/60" : "text-[#555]"}`}
                >
                  E
                </Text>
                <TouchableOpacity className="absolute bottom-0 right-0 bg-black p-2 rounded-full border-2 border-white">
                  <Camera size={16} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Título e Lápis */}
            <View className="px-4 mb-2">
              <Text
                className={`text-xs font-open-sans font-bold uppercase tracking-tighter ${isDark ? "text-white/60" : "text-black"}`}
              >
                Aqui pode fazer alterações às suas informações de{"\n"}
                identificação e de contacto.
              </Text>
              <View className="flex-row justify-between items-center mt-6 mb-2">
                <Text
                  className={`text-lg font-safiro ${isDark ? "text-white" : "text-[#111]"}`}
                >
                  A SUA IDENTIFICAÇÃO
                </Text>
                {!isEditing && (
                  <TouchableOpacity onPress={() => setIsEditing(true)}>
                    <Pencil size={22} color={isDark ? "white" : "black"} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            <GerirPerfilFormulario
              formData={userData}
              setFormData={setUserData}
              isEditing={isEditing}
            />

            {/* Botão Alterar */}
            <View className="mt-4 px-4">
              <View className="w-full items-center">
                <Button
                  variant="primary"
                  label="Alterar"
                  onPress={handleSave}
                />
              </View>
            </View>

            {/* Cards Extras */}
            <View className="px-4 mt-10">
              <View
                className={`p-6 rounded-[32px] mb-4 ${isDark ? "bg-aide-dark-card" : "bg-white"}`}
                style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
              >
                <Text
                  className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}
                >
                  Apagar Conta
                </Text>
                <Text
                  className={`text-xs font-bold mt-1 ${isDark ? "text-white/60" : "text-gray-800"}`}
                >
                  Ao apagar a sua conta todos os dados vão ser perdidos no
                  espaço de 30 dias.
                </Text>
                <TouchableOpacity
                  className="mt-4 py-3 rounded-xl items-center self-center"
                  onPress={() => console.log("Apagar conta")}
                >
                  <View
                    className={`py-3 px-8 rounded-xl ${isDark ? "bg-red-500/20" : "bg-red-100"}`}
                  >
                    <Text
                      className={`font-medium ${isDark ? "text-red-400" : "text-red-600"}`}
                    >
                      Apagar
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View
                className={`p-6 rounded-[32px] ${isDark ? "bg-aide-dark-card" : "bg-white"}`}
                style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
              >
                <View className="flex-row items-center justify-between">
                  <Text
                    className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}
                  >
                    Health Connect
                  </Text>
                  <Ionicons
                    name="heart-circle-outline"
                    size={26}
                    color={isDark ? "#FF7A7A" : "#D64550"}
                  />
                </View>
                <Text
                  className={`text-xs font-bold mt-1 ${isDark ? "text-white/60" : "text-gray-800"}`}
                >
                  {isLoadingHealthConnect
                    ? "A verificar a ligacao ao Health Connect."
                    : healthConnectStatus?.permissionsGranted
                      ? "O Health Connect ja esta ligado e pronto para ler passos, frequencia cardiaca e outros dados de saude."
                      : "Ligue a sua conta ao Health Connect para gerir permissoes de passos, frequencia cardiaca e outros dados de saude."}
                </Text>
                {!isLoadingHealthConnect &&
                  healthConnectStatus?.permissionsGranted && (
                    <View
                      className={`mt-4 self-start px-4 py-2 rounded-full flex-row items-center ${isDark ? "bg-emerald-500/15" : "bg-emerald-100"}`}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={isDark ? "#86efac" : "#15803d"}
                      />
                      <Text
                        className={`ml-2 text-xs font-bold ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
                      >
                        Ligacao ativa
                      </Text>
                    </View>
                  )}
                <TouchableOpacity
                  className="mt-4 py-3 rounded-xl items-center self-center"
                  onPress={() => router.push("/health-connect")}
                >
                  <View
                    className={`py-3 px-8 rounded-xl ${isDark ? "bg-[#D64550]/20" : "bg-rose-100"}`}
                  >
                    <Text
                      className={`font-medium ${isDark ? "text-rose-300" : "text-rose-600"}`}
                    >
                      {healthConnectStatus?.permissionsGranted
                        ? "Gerir ligacao"
                        : "Abrir Health Connect"}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View
                className={`p-6 rounded-[32px] mt-4 ${isDark ? "bg-aide-dark-card" : "bg-white"}`}
                style={{ boxShadow: "0 2px 8px 0 rgba(0, 0, 0, 0.12)" }}
              >
                <Text
                  className={`text-xl font-bold ${isDark ? "text-white" : "text-black"}`}
                >
                  Pedir Dados
                </Text>
                <Text
                  className={`text-xs font-bold mt-1 ${isDark ? "text-white/60" : "text-gray-800"}`}
                >
                  Pedir dados que a AIDE têm sobre ti, desde a sua criação de
                  conta em formato XML.
                </Text>
                <TouchableOpacity
                  className="mt-4 py-3 rounded-xl items-center self-center"
                  onPress={() => console.log("Extrair dados")}
                >
                  <View
                    className={`py-3 px-8 rounded-xl ${isDark ? "bg-blue-500/20" : "bg-blue-100"}`}
                  >
                    <Text
                      className={`font-medium ${isDark ? "text-blue-400" : "text-blue-600"}`}
                    >
                      Extrair
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View className="mt-6">
                <TouchableOpacity
                  className="w-full items-center"
                  onPress={signOut}
                >
                  <View
                    className={`py-3 px-8 rounded-xl ${isDark ? "bg-red-500/20" : "bg-red-100"}`}
                  >
                    <Text
                      className={`font-medium ${isDark ? "text-red-400" : "text-red-600"}`}
                    >
                      Logout
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </LightBackground>
  );
};

export default GerirPerfil;
